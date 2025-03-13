# ollama create cardano-llama -f ./cardano_llama3.2-1B/Modelfile
# ollama run cardano-llama
# PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
# project id: 1048008
# task id: 36687405
# export OLLAMA_HOST="0.0.0.0:11435"
# export OLLAMA_ORIGINS="*"
# ollama serve
# watch -d -n 1 nvidia-smi
# Run ollama create cardano-llama -f ./cardano_llama3.2-1B/Modelfile and ollama run cardano-llama to test the model.
# From home pc to base: ssh -i ~/.ssh/bakon_nerc -v -L 8080:localhost:7861 bakon@199.94.60.53
# from base to nerc:    ssh -i /home/bakon/.ssh/dev_gpu_key -v -L 7861:localhost:7860 bakon@199.94.61.196
# python3 -m venv .venvfactory
# ssh -i /home/bakon/.ssh/dev_gpu_key bakon@199.94.61.196
# source /mnt/data/RiskIntel/ai-drep/experiments/ai_assistant_for_governance/.venv/bin/activate
# llamafactory-cli webui


from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer
from trl import SFTTrainer
from huggingface_hub import login
from peft import LoraConfig, get_peft_model
import os
import torch
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Check if GPU is available(Nvidia only)
if torch.cuda.is_available():
    print(f"GPU Found: {torch.cuda.get_device_name(0)}")
    device = "cuda"
else:
    device = "cpu"
    print("No GPU found, falling back to CPU.")

#Define user vars here
huggingFaceToken = os.getenv('HUGGING_FACE_TOKEN')
if not huggingFaceToken:
    raise ValueError("Hugging Face token not found in .env file")
llm_model_id = "meta-llama/Llama-3.2-1B"
#llm_model_id = "deepseek-ai/DeepSeek-R1"

# Use PEFT
from peft import LoraConfig, get_peft_model

peft_config = LoraConfig(
    r=4,  # Lower rank might reduce the extent of adaptation
    lora_alpha=16,  # Lower alpha might reduce the impact of new weights
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.1,  # Slightly higher dropout might help with generalization
    bias="none",
)

if not os.path.exists("./results"):
    os.makedirs("./results")
    print("Created results directory.")

def format_data(example):
    # Simplified formatting without the tags
    return {
        'text': f"{example['prompt']}\n{example['completion']}"
    }

# Step 3: Data Preparation
dataset = load_dataset("json", data_files="../training_data/jsonl/combined.jsonl", split="train")
dataset = dataset.map(format_data, remove_columns=['prompt', 'completion'])

# Split dataset for training and evaluation
dataset = dataset.train_test_split(test_size=0.1)
train_dataset = dataset['train']
eval_dataset = dataset['test']

# Step 4: Model Preparation
model_id = llm_model_id
try:
    login(token=huggingFaceToken)
    model = AutoModelForCausalLM.from_pretrained(model_id, token=huggingFaceToken).to(device)  # Move model to GPU
    model = get_peft_model(model, peft_config)  # Apply PEFT
    model.config.use_cache = False  # Set use_cache to False here
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    tokenizer.pad_token = tokenizer.eos_token  # Set pad_token to eos_token
except Exception as e:
    print(f"An error occurred during model/tokenizer loading: {e}")
    # Ensure we set a default tokenizer if the loading fails
    tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')  # Fallback tokenizer

# Step 5: Fine-Tuning - Initialize training arguments once
batch_size = 1  # Or even higher depending on your dataset size and model memory requirements
gradient_accumulation_steps = 32  # Increase if you decrease batch size
epochs_train    = 1
save_steps      = 500
learning_rate   = 1e-6 # lowered from to help with over training on small data sets: 5e-6 * (1 / 4)
eval_steps      = 100  # lowered from: 200 Based on your dataset size and training speed
warmup          = 100  # Adjust based on your dataset size
max_grad_norm   = 1.0
checkpoint = "./results/checkpoints/checkpoint" if os.path.exists("./results/checkpoints/checkpoint") else None

# Training arguments
training_args = TrainingArguments(
    output_dir="./results/checkpoints",
    num_train_epochs=epochs_train,
    per_device_train_batch_size=batch_size,
    gradient_accumulation_steps=gradient_accumulation_steps,
    learning_rate=learning_rate,
    logging_steps=50,  # Adjust based on how often you want updates
    save_steps=save_steps,
    eval_strategy="steps",
    eval_steps=eval_steps,
    warmup_steps=warmup,
    max_grad_norm=max_grad_norm,
    gradient_checkpointing=True,
    fp16=True,
    resume_from_checkpoint=checkpoint
)

print(f"Output directory path: {os.path.abspath(training_args.output_dir)}")

# Initialize trainer once
trainer = None
try:
    trainer = SFTTrainer(
        model=model,
        peft_config=peft_config,  # Use the PEFT config
        processing_class=tokenizer,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,  
        formatting_func=lambda example: example['text'],
    )
    print(f"Trainer state before training: {trainer.state}")
    if training_args.resume_from_checkpoint:
        print("Checkpoint loaded successfully.")
    else:
        print("Training will start from scratch as no checkpoint was found.")
except Exception as e:
    print(f"Failed to initialize trainer: {str(e)}")
    import traceback
    traceback.print_exc()

# Before training, ensure all model parameters require gradients
for param in model.parameters():
    param.requires_grad = True

# Training loop
# After training, if trainer was successfully initialized and training completed
if trainer:
    # Start fine-tuning
    trainer.train()

    # Merge the adapters back into the base model
    model = trainer.model
    model = model.merge_and_unload()

    # Save the model after training
    model.save_pretrained("./results/trained/"+llm_model_id)
    tokenizer.save_pretrained("./results/trained/"+llm_model_id)

    print("Full model with merged adapters saved successfully.")
else:
    print("Training could not be started or completed, model not saved.")