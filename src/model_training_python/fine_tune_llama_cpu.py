# python -m venv myenv
# source myenv/bin/activate
# pip install -r requirements.txt

from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer
from trl import SFTTrainer
from huggingface_hub import login
import os

if not os.path.exists("./results"):
    os.makedirs("./results")
    print("Created results directory.")

def format_data(example):
    return {
        'text': f"<|im_start|>user\n{example['prompt']}<|im_end|>\n<|im_start|>assistant\n{example['completion']}<|im_end|>\n"
    }

# Step 3: Data Preparation
dataset = load_dataset("json", data_files="combined1.jsonl", split="train")
dataset = dataset.map(format_data, remove_columns=['prompt', 'completion'])

# Step 4: Model Preparation
model_id = "meta-llama/Llama-3.2-11B-Vision"
try:
    login(token="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")
    model = AutoModelForCausalLM.from_pretrained(model_id, token="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")
    tokenizer = AutoTokenizer.from_pretrained(model_id)
except Exception as e:
    print(f"An error occurred: {e}")

# Step 5: Fine-Tuning
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=1,  # You might want to adjust this for CPU performance
    gradient_accumulation_steps=4,
    learning_rate=2e-5,
    logging_steps=10,
    save_steps=500,
    evaluation_strategy="steps",
    eval_steps=500,
    # Explicitly set no_cuda to True to ensure CPU usage
    no_cuda=True
)

print(f"Output directory path: {os.path.abspath(training_args.output_dir)}")

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    args=training_args,
    train_dataset=dataset,
    dataset_text_field="text",
    max_seq_length=2048,
)

# Start fine-tuning
trainer.train()

# Save the model after training
model.save_pretrained("./fine_tuned_llama3.2-vision")
tokenizer.save_pretrained("./fine_tuned_llama3.2-vision")