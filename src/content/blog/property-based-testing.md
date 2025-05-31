---
title: 'An argument for property-based testing'
pubDate: 2025-05-31
description: 'Exploring the power of property-based testing with Vitest and fast-check.'
author: 'Wojciech'
image:
    url: 'https://docs.astro.build/assets/full-logo-light.png'
    alt: 'The full Astro logo.' # TODO
tags:
    [
        'testing',
        'property-based testing',
        'vitest',
        'fast-check',
        'playwright',
        'e2e',
        'unit testing',
        'component testing',
    ]
---

## Why?

Throughout my career, throughout my engineering thesis, and definitely in my personal projects, I've been fascinated by and have explored property-based testing a lot. Their paradigm shifts the focus from testing specific scenarios to testing generalized properties that a system should uphold. Instead of manually crafting (or automating their creation by fuzzing) test cases, a given characteristic can be defined with a set of valid inputs and expected behavior, and a property based testing framework wi ll generate inputs to test these properties.

### What is property-based testing?

Property-based Testing is a software testing technique where, instead of testing with specific examples, a list of properties is created that should be satisfied by the system for all valid inputs. These properties are essentially universal truths about the code's behavior. If a property holds true for a wide range of generated inputs (rather than one or a few as it's done in "normal" tesing), it increases confidence in the correctness of the system.

This concept originated from the functional programming community, most notably with the Haskell library **QuickCheck**, developed in 2000. QuickCheck introduced the idea of generating random test data based on specified types and then checking if a given property holds for all generated values.

##### Sidenote: formal specifications

PBT has strong ties to formal methods and mathematical reasoning. When a property is defined, a partial formal specification of the system's behaviour is created. PBT aims to _falsify_ the property by finding a counterexample. If no counterexample is found after a sufficient (defined by the user) number of tests, it provides strong(-er than a single test) evidence that the property holds.

Key mathematical and logical concepts that describe this method:

- **Invariants**: properties often describe invariants — conditions that must always be true throughout the execution in the system or for a data structure. For example, a sorting algorithm's property might be that the output list always has the same elements as the input list, just in a different order (a permutation), and that the output list is sorted.

- **Algebraic properties**: in functional programming, PBT is commonly used to verify algebraic properties of functions, such as associativity, commutativity, or identity laws. For instance, for a function `f` and an identity element `id`, a property might be `f(x, id) == x`.

- **Pre-conditions and post-conditions**: properties can be seen as a form of executable specification of pre-conditions (what must be true before a function is called) and post-conditions (what must be true after a function completes).

- **Guided randomized testing**: while inputs are generated randomly, the goal is not "just" fuzzing. The generation is guided by arbitraries - generators - that ensure structural validity. The more tests pass, the higher the statistical confidence that the property holds, but importantly, it **doesn't** offer the same guarantee as a formal proof.

In essence, PBT bridges the gap between rigorous formal verification and practical, automated testing. It encourages software engineers to think about the fundamental truths of their code, leading to more robust and reliable software.

### Let's test

`fast-check` is a property-based testing framework for JavaScript and TypeScript (alternatives for most popular languages exist). Let's dive into an example piece of code:

<details class="code-collapse">
<summary>Code example #1</summary>

```typescript
interface Item {
    price: number;
    quantity: number;
}

function calculateTotalPrice(items: Item[], taxRate: number, discount: number): number {
    let subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let total = subtotal * (1 + taxRate / 100);
    total = total * (1 - discount / 100);
    return parseFloat(total.toFixed(2));
}
```

</details>

Where a traditional test suite might look like this:

<details class="code-collapse">
<summary>Traditional test example #1</summary>

```typescript
test('should calculate total price with tax and discount', () => {
    const items = [{ price: 10, quantity: 2 }];
    expect(calculateTotalPrice(items, 10, 5)).toBe(20.9); // 20 * 1.10 * 0.95 = 20.9
});

test('should handle multiple items', () => {
    const items = [
        { price: 10, quantity: 1 },
        { price: 20, quantity: 2 },
    ];
    expect(calculateTotalPrice(items, 0, 0)).toBe(50); // 10 + 40 = 50
});

test('should handle zero items', () => {
    const items: Item[] = [];
    expect(calculateTotalPrice(items, 10, 0)).toBe(0);
});

test('should handle zero tax and discount', () => {
    const items = [{ price: 10, quantity: 2 }];
    expect(calculateTotalPrice(items, 0, 0)).toBe(20);
});

// ...
```

</details>

With `fast-check`, properties are defined that should hold true for the `calculateTotalPrice` function across many (tens? hundreds? thousands? you decide) generated inputs:

<details class="code-collapse">
<summary>PBT test example #1</summary>

```typescript
import { test, expect } from 'vitest';
import * as fc from 'fast-check';

test('calculateTotalPrice properties: should maintain mathematical invariants', () => {
    // arbitrary for generating valid items
    const itemArbitrary = fc.record({
        price: fc.float({ min: 0.01, max: 1000, noNaN: true }),
        quantity: fc.integer({ min: 1, max: 100 }),
    }); // conforms to the Item interface

    fc.assert(
        fc.property(
            fc.array(itemArbitrary, { minLength: 0, maxLength: 10 }),
            fc.float({ min: 0, max: 50, noNaN: true }), // tax rate
            fc.float({ min: 0, max: 50, noNaN: true }) // discount
        ),
        (items, taxRate, discount) => {
            const total = calculateTotalPrice(items, taxRate, discount);

            // property: total should never be negative
            expect(total).toBeGreaterThanOrEqual(0);

            // property: if no items, total should be 0
            if (items.length === 0) {
                expect(total).toBe(0);
            }

            // property: if no tax and no discount, total should equal subtotal
            if (taxRate === 0 && discount === 0) {
                const expectedSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                expect(total).toBeCloseTo(expectedSubtotal, 2);
            }

            // property: total should be finite and a valid number
            expect(Number.isFinite(total)).toBe(true);
            expect(Number.isNaN(total)).toBe(false);
        }
    );
});

test('calculateTotalPrice monotonicity: tax and discount effects', () => {
    const itemArbitrary = fc.record({
        price: fc.float({ min: 0.01, max: 100, noNaN: true }),
        quantity: fc.integer({ min: 1, max: 10 }),
    });

    fc.assert(
        fc.property(
            fc.array(itemArbitrary, { minLength: 1, maxLength: 5 }),
            fc.float({ min: 0, max: 20, noNaN: true }),
            fc.float({ min: 0, max: 20, noNaN: true })
        ),
        (items, baseTaxRate, baseDiscount) => {
            const baseTotal = calculateTotalPrice(items, baseTaxRate, baseDiscount);

            // property: higher tax rate should result in higher total (with same discount)
            const higherTaxTotal = calculateTotalPrice(items, baseTaxRate + 5, baseDiscount);
            expect(higherTaxTotal).toBeGreaterThanOrEqual(baseTotal);

            // property:hHigher discount should result in lower total (with same tax)
            const higherDiscountTotal = calculateTotalPrice(items, baseTaxRate, baseDiscount + 5);
            expect(higherDiscountTotal).toBeLessThanOrEqual(baseTotal);
        }
    );
});
```

In this example:

- `fc.property` defines a property function that should hold for all inputs.
- `fc.record()` creates an arbitrary for generating objects with specific structure (`Item` interface).
- `fc.array()` generates arrays of items.
- `fc.float()` and `fc.integer()` generate numeric values within ranges.
- `fc.assert()` runs the property with generated inputs.

Also see the official `fast-check` documentation:

- [GitHub Repository](https://github.com/dubzzz/fast-check)
- [Docs](https://fast-check.dev/docs/quick-start/)

</details>

A compelling argument can be made that this amount of code and such syntax might be overkill for such a simple function. Above example is here just to serve as a reference point - it clearly shows the segregation of duties in the framework API. However, just based on the example above, a few areas in which property-based testing excels in are noticable:

- Uncovering edge cases: `fast-check` is able to explore a vast input space without scenarios.

- Testing invariants: anywhere correctness means preserving round-trip equivalences, and especially with data structures (parsers, serializers, protocols).

- Expressing general properties: documents the exact intention of the person implementing the feature and puts it into a structured description.

#### PBT vs. fuzzing

I see these two terms being used interchangeably online. There is a semantic difference between the two (and, in my opinion, one that separates their purpose)

- fuzzing primarily focuses on finding bugs by feeding a program with large amounts of malformed, unexpected, or random data to crash it or expose vulnerabilities. It's often about finding _any_ input that breaks the system, without necessarily having a predefined "correct" output for every input. Fuzzers are excellent at uncovering crashes, memory leaks, security flaws and the like.

- property-based testing is about verifying _logical properties_ or invariants. Think of it as of a subset of fuzzing - by declaratively defining what property to be checked against, and how it is supposed to work, a much smaller, targeted input space is to be explored.

#### Shrinking

One of the key features that sets property-based testing apart from fuzzing is shrinking. When a property-based test fails, fast-check doesn’t just report the first input that caused the failure - it goes further by minimizing that input. The framework will try to find the smallest, input that still triggers the bug. For example, if a complex object or a long array caused a test to fail, shrinking will iteratively reduce the size and complexity of that input until it finds the minimal example that reproduces the problem. This allows for easier debugging and faster root cause analysis.

### Takeways

Property-based testing will expand your toolbox. It is not a a fix-for-all nor will it replace the regular unit tests you write. It will allow you to become more defensive as a software engineer and it will fit into places where no other methods go. In my experience, it allows the developer to take a high-level overview of the feature they're creating without the constant need of abstractions such as BDD defined in Gherkin.

### Model-based testing

`fast-check` also supports model-based testing, a feature that has fundamentally changed the way I think about and write automated tests. I will explore this in the next blog post, together with some examples of a UI automation testing using Playwright!
