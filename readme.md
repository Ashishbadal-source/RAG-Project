# MIRAGE

MIRAGE is a simple Retrieval-Augmented Generation (RAG) evaluation project. It allows you to test different retrieval models, language models, and complete RAG pipelines using multiple question-answer datasets.

The project supports:

- RAG pipeline evaluation
- LLM evaluation
- Retriever evaluation
- Multiple QA datasets
- Configurable experiments

---

# Project Structure

```
MIRAGE/
│
├── config.yaml              # Project configuration
├── main.py                  # Runs RAG / LLM / Retriever experiments
├── evaluation.py            # Calculates evaluation metrics
├── requirements.txt         # Python dependencies
│
├── datasets/                # QA datasets
├── models/                  # Retriever and LLM related code
├── retriever/               # Retrieval modules
├── rag/                     # RAG pipeline
├── utils/                   # Helper functions
├── outputs/                 # Generated predictions
└── Evaluation_result/       # Final evaluation reports
```

---

# Features

- Evaluate Retrieval-Augmented Generation (RAG)
- Compare different retrievers
- Compare different LLMs
- Configurable through `config.yaml`
- Easy to extend with new datasets or models

---

# Installation

Create a virtual environment

```bash
conda create -n mirage python=3.11
conda activate mirage
```

Clone the repository

```bash
git clone <repository-url>
cd MIRAGE
```

Install dependencies

```bash
pip install -r requirements.txt
```

---

# Configuration

All experiment settings are available in

```
config.yaml
```

You can modify:

- LLM
- Retriever
- Dataset
- Batch size
- Number of retrieved documents
- Experiment mode

---

# Running the Project

Run experiments

```bash
python main.py
```

Run evaluation

```bash
python evaluation.py
```

---

# Available Modes

The project supports three execution modes:

- RAG
- LLM
- Retriever

The mode can be selected from `config.yaml`.

---

# Output

After execution, generated predictions are stored inside

```
outputs/
```

Evaluation reports are generated inside

```
Evaluation_result/
```

The reports include:

- LLM Scores
- Retriever Scores
- RAG Metrics

---

# Workflow

```
Dataset
    │
    ▼
Retriever
    │
    ▼
Relevant Context
    │
    ▼
Language Model
    │
    ▼
Generated Answer
    │
    ▼
Evaluation
```

---

# Requirements

- Python 3.11
- PyTorch
- SentenceTransformers
- vLLM
- Transformers

Install all dependencies using

```bash
pip install -r requirements.txt
```

---

# Customization

You can easily:

- Add new datasets
- Replace retrievers
- Use different LLMs
- Modify evaluation settings
- Run custom RAG experiments

---

# Example Commands

```bash
python main.py
```

```bash
python evaluation.py
```

---

# Tech Stack

- Python
- PyTorch
- Sentence Transformers
- Transformers
- vLLM
- YAML
