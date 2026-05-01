---
title: 'Pact & chaos testing'
order: 7
logos:
    - src: '/logos/pact.svg'
      alt: 'Pact'
    - src: '/logos/k8s.svg'
      alt: 'Kubernetes'
---

Implemented contract testing with Pact across a Kubernetes-based microservice architecture, as well as fault-injection testing.

Pact brokers were integrated into CI/CD pipelines, which has prevented many API misalignments in the five-team project.

Fault-injection scenarios, such as increased latency, dropped packets, pod kills, dependency timeouts, were introduced to confirm graceful degradation, retry behaviour and circuit-breaker pattern under realistic failure modes.
