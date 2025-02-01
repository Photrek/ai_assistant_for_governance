# python -m venv llm_finetuning_env
# source llm_finetuning_env/bin/activate
# pip install -r requirements.txt

from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer
from trl import SFTTrainer
from huggingface_hub import login
import os

huggingFaceToken = ""

if not os.path.exists("./results"):
    os.makedirs("./results")
    print("Created results directory.")

def format_data(example):
    return {
        'text': f"<|im_start|>user\n{example['prompt']}<|im_end|>\n<|im_start|>assistant\n{example['completion']}<|im_end|>\n"
    }

# Step 3: Data Preparation
dataset = load_dataset("json", data_files="../training_data/jsonl/output.jsonl", split="train")
dataset = dataset.map(format_data, remove_columns=['prompt', 'completion'])

# Split dataset for training and evaluation
dataset = dataset.train_test_split(test_size=0.1)
train_dataset = dataset['train']
eval_dataset = dataset['test']

# Step 4: Model Preparation
model_id = "meta-llama/Llama-3.2-1B"
try:
    login(token=huggingFaceToken)
    model = AutoModelForCausalLM.from_pretrained(model_id, token=huggingFaceToken)
    model.config.use_cache = False  # Set use_cache to False here
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    tokenizer.pad_token = tokenizer.eos_token  # Set pad_token to eos_token
except Exception as e:
    print(f"An error occurred: {e}")

# Step 5: Fine-Tuning
# Adjust batch size or gradient accumulation if needed
batch_size = 4
gradient_accumulation_steps = 1  # Increase if you decrease batch size

training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=batch_size,
    gradient_accumulation_steps=gradient_accumulation_steps,
    learning_rate=2e-5,
    logging_steps=10,
    save_steps=500,
    eval_strategy="steps",
    eval_steps=500,
    gradient_checkpointing=True,
    fp16=True,
    # Consider uncommenting and adjusting if necessary:
    # max_seq_length=768
)

print(f"Output directory path: {os.path.abspath(training_args.output_dir)}")

trainer = SFTTrainer(
    model=model,
    processing_class=tokenizer,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,  
    formatting_func=lambda example: example['text'],
)

# Start fine-tuning
trainer.train()

# Save the model after training
model.save_pretrained("./fine_tuned_llama3.2-vision")
tokenizer.save_pretrained("./fine_tuned_llama3.2-vision")