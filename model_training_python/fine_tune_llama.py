#ollama create cardano-llama -f ./cardano_llama3.2-1B/Modelfile
#ollama run cardano-llama

from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer
from trl import SFTTrainer
from huggingface_hub import login
import os
import torch
print(torch.cuda.is_available())
print(torch.version.hip)

#Define user vars here
huggingFaceToken = "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"
#llm_model_id = "meta-llama/Llama-3.2-1B"
llm_model_id = "deepseek-ai/DeepSeek-R1"
epochs_train = 1
save_steps = 200

# Check if AMD GPU is available
if torch.cuda.is_available() and torch.version.hip:
    device = "cuda"
else:
    device = "cpu"
    print("No AMD GPU found, falling back to CPU.")


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
    model.config.use_cache = False  # Set use_cache to False here
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    tokenizer.pad_token = tokenizer.eos_token  # Set pad_token to eos_token
except Exception as e:
    print(f"An error occurred during model/tokenizer loading: {e}")

# Step 5: Fine-Tuning
# Adjust batch size or gradient accumulation if needed
batch_size = 4
gradient_accumulation_steps = 1  # Increase if you decrease batch size

training_args = TrainingArguments(
    output_dir="./results/checkpoints",
    num_train_epochs=epochs_train,
    per_device_train_batch_size=batch_size,
    gradient_accumulation_steps=gradient_accumulation_steps,
    learning_rate=2e-5,
    logging_steps=10,
    save_steps=save_steps,
    eval_strategy="steps",
    eval_steps=500,
    gradient_checkpointing=True,
    fp16=True,
    resume_from_checkpoint="./results/checkpoints/checkpoint-200/"
)

print(f"Output directory path: {os.path.abspath(training_args.output_dir)}")

# Try to initialize the trainer with checkpoint loading
try:
    trainer = SFTTrainer(
        model=model,
        peft_config=None,  # If you're not using PEFT
        processing_class=tokenizer,  # Replace tokenizer with processing_class
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,  
        formatting_func=lambda example: example['text'],
    )
    print("Checkpoint loaded successfully.")
except Exception as e:
    print(f"An error occurred while loading the checkpoint: {e}")
    # Here you can decide what to do if loading fails, e.g., start from scratch or handle it differently
    # For example, you might want to remove the resume_from_checkpoint parameter:
    training_args_no_resume = TrainingArguments(
        output_dir="./results/checkpoints",
        num_train_epochs=epochs_train,
        per_device_train_batch_size=batch_size,
        gradient_accumulation_steps=gradient_accumulation_steps,
        learning_rate=2e-5,
        logging_steps=10,
        save_steps=save_steps,
        eval_strategy="steps",
        eval_steps=500,
        gradient_checkpointing=True,
        fp16=True,
    )
    trainer = SFTTrainer(
        model=model,
        peft_config=None,  # If you're not using PEFT
        processing_class=tokenizer,  # Replace tokenizer with processing_class
        args=training_args_no_resume,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,  
        formatting_func=lambda example: example['text'],
    )
    print("Training will start from scratch due to checkpoint loading failure.")

# Start fine-tuning
trainer.train()

# Save the model after training
model.save_pretrained("./results/trained/"+llma_model_id)
tokenizer.save_pretrained("./results/trained/"+llma_model_id)