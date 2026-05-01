---
title: 'Data testing - GX & Kafka'
order: 8
logos:
    - src: '/logos/greatexpectations.svg'
      alt: 'Great Expectations'
    - src: '/logos/kafka.svg'
      alt: 'Apache Kafka'
---

Designed a data testing solution that applies Great Expectations to streaming data flowing through Kafka topics.

Expectation suites were authored for each critical stream, validating schema, distributions, referential integrity and freshness - failures triggered alerting and quarantine routing rather than silently polluting downstream systems.

The integration sampled topics continuously, materialised validation runs and surfaced data quality trends, giving data consumers the same level of confidence in real-time pipelines that traditional test suites provide for code.
