---
title: 'Model training'
order: 2
logos:
    - src: '/logos/hf.svg'
      alt: 'HuggingFace'
    - src: '/logos/databricks.svg'
      alt: 'Azure'
---

Created a custom dataset based on the internal (in-house products) and vendor-provided documentation. Created multiple hot-swappable rank-16 adapters for an open-weight model using 4-bit NF4 QLoRA. Deployed the models using Databricks and validated their correctness using DeepEval. Deployed models were used for internal purposes, such as code generation (company specific frameworks), answering questions, debugging and tool use.

The data was augmented with synthetic Q/A pairs distilled from a frontier teacher model and manually filtered. G-Eval, hallucination, Pass@k metrics were used for validation.