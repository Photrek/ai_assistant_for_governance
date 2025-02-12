from datasets import load_dataset, Dataset
from transformers import pipeline
from collections import Counter
import numpy as np
from textdescriptives import extract_metrics

data = '../training_data/jsonl/combined.jsonl'

# Load the dataset
dataset = load_dataset('json', data_files=data, split='train')

# 1. Text Length Analysis
def compute_text_length(example):
    return {"length": len(example['text'])}

dataset = dataset.map(compute_text_length)
lengths = dataset["length"]
print(f"Text Length Analysis - Min: {np.min(lengths)}, Max: {np.max(lengths)}, Mean: {np.mean(lengths)}")

# 2. Check for empty or near-empty texts
empty_texts = dataset.filter(lambda example: len(example['text'].strip()) == 0)
print(f"Number of empty texts: {len(empty_texts)}")

# 3. Text Diversity - Unique Words
def tokenize_and_count(example):
    words = example['text'].lower().split()
    return {"tokens": words}

tokenized_dataset = dataset.map(tokenize_and_count, batched=True, remove_columns=['text'])

all_words = []
for example in tokenized_dataset:
    all_words.extend(example['tokens'])

word_count = Counter(all_words)
print(f"Total unique words: {len(word_count)}")

# 4. Stop Words Frequency
from nltk.corpus import stopwords
stop_words = set(stopwords.words('english'))

stop_words_count = sum(1 for word in all_words if word in stop_words)
print(f"Total stop words: {stop_words_count}")

# 5. Readability and Complexity Metrics using textdescriptives
def compute_text_metrics(example):
    metrics = extract_metrics(example['text'])
    return {"readability": metrics["readability"]["flesch_kincaid"], 
            "complexity": metrics["complexity"]["lexical_diversity"]}

dataset_with_metrics = dataset.map(compute_text_metrics)
readability_scores = dataset_with_metrics["readability"]
complexity_scores = dataset_with_metrics["complexity"]

print(f"Readability (Flesch-Kincaid) - Min: {np.min(readability_scores)}, Max: {np.max(readability_scores)}, Mean: {np.mean(readability_scores)}")
print(f"Lexical Diversity - Min: {np.min(complexity_scores)}, Max: {np.max(complexity_scores)}, Mean: {np.mean(complexity_scores)}")

# 6. Check for Semantic Consistency (example using a Hugging Face model)
sentiment_pipeline = pipeline("sentiment-analysis")
def analyze_sentiment(example):
    sentiment = sentiment_pipeline(example['text'])[0]
    return {"sentiment": sentiment['label'], "sentiment_score": sentiment['score']}

dataset_with_sentiment = dataset.map(analyze_sentiment)

# Count sentiments
sentiment_counts = Counter(dataset_with_sentiment["sentiment"])
print(f"Sentiment Distribution: {sentiment_counts}")

# Example of spotting outliers in sentiment scores
too_extreme_sentiments = dataset_with_sentiment.filter(lambda example: example['sentiment_score'] > 0.98 or example['sentiment_score'] < 0.02)
print(f"Number of texts with extreme sentiment scores: {len(too_extreme_sentiments)}")