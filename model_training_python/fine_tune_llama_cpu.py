# python -m venv llm_finetuning_env
# source llm_finetuning_env/bin/activate
# pip install -r requirements.txt

from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer
from trl import SFTTrainer
from huggingface_hub import login
import os

huggingFaceToken = "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"

if not os.path.exists("./results"):
    os.makedirs("./results")
    print("Created results directory.")

def format_data(example):
    return {
        'text': f"<|im_start|>user\n{example['prompt']}<|im_end|>\n<|im_start|>assistant\n{example['completion']}<|im_end|>\n"
    }

try:
    # Step 3: Data Preparation
    dataset = load_dataset("json", data_files="../training_data/jsonl/combined.jsonl", split="train")
    dataset = dataset.map(format_data, remove_columns=['prompt', 'completion'])

    # Split dataset for training and evaluation
    dataset = dataset.train_test_split(test_size=0.1)
    train_dataset = dataset['train']
    eval_dataset = dataset['test']

    # Step 4: Model Preparation
    model_id = "meta-llama/Llama-3.2-1B"
    login(token=huggingFaceToken)
    model = AutoModelForCausalLM.from_pretrained(model_id, token=huggingFaceToken)
    model.config.use_cache = False  # Set use_cache to False here
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    tokenizer.pad_token = tokenizer.eos_token  # Set pad_token to eos_token

    # Step 5: Fine-Tuning
    training_args = TrainingArguments(
        output_dir="./results",
        num_train_epochs=3,
        per_device_train_batch_size=1,  
        gradient_accumulation_steps=4,
        learning_rate=2e-5,
        logging_steps=10,
        save_steps=500,
        eval_strategy="steps",
        eval_steps=500,
        gradient_checkpointing=True,
        use_cpu=True,
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

except Exception as e:
    print(f"An error occurred during the main process: {type(e).__name__}: {str(e)}")
    import traceback
    print("Traceback:")
    traceback.print_exc()

except KeyboardInterrupt:
    print("Training interrupted by the user.")