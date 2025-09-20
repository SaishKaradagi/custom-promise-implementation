# Building a Promise from Scratch: A Complete TypeScript Deep Dive

> Ever wondered how Promises actually work under the hood? Let's build one from scratch and understand every single line of code together. By the end of this guide, you'll have a crystal-clear understanding of Promises, TypeScript generics, and asynchronous JavaScript.

[![TypeScript](https://img.shields.io/badge/TypeScript-4.0+-blue.svg)](https://www.typescriptlang.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2015+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Async](https://img.shields.io/badge/Async-Promises-green.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)

## 👋 Hey there, fellow developer!

If you're here, you probably use Promises every day but want to understand what's really happening when you call `.then()` or `.catch()`. Maybe you've seen TypeScript generics but aren't quite sure how they work in practice. Or perhaps you're curious about the event loop and microtasks.

Well, you're in the right place! We're going to build a Promise implementation from the ground up, and I'll explain every concept as if we're pair programming together. No jargon, no assumptions - just clear explanations and practical examples.

## 🎯 What We'll Build Together

By the end of this journey, you'll understand:
- **How Promises manage state** (and why they can only resolve once)
- **TypeScript generics in action** (with real examples, not abstract theory)
- **Event loop mechanics** (microtasks vs macrotasks, and why it matters)
- **Memory management** (what happens when you chain `.then()` calls)
- **Common gotchas** (and how to avoid them in your own code)

Think of this as the guide I wish I had when I was learning these concepts!

## 📋 Our Roadmap

1. [🤔 The "Why" Behind Promises](#why-promises)
2. [🔧 TypeScript Fundamentals (The Building Blocks)](#typescript-fundamentals)
3. [🏗️ Building Our Promise Step by Step](#building-our-promise)
4. [🔍 Walking Through the Code (Like a Debugger)](#code-walkthrough)
5. [🧠 Memory & Execution (What Actually Happens)](#execution-flow)
6. [⚡ TypeScript Magic Explained](#typescript-features)
7. [⚖️ How It Compares to Real Promises](#native-comparison)
8. [🚨 Common Mistakes (Learn from My Pain)](#pitfalls)
9. [🚀 Advanced Stuff (For the Curious)](#advanced-concepts)
10. [✨ Key Takeaways](#takeaways)

---

## 🤔 The "Why" Behind Promises

Before we dive into code, let's talk about why Promises exist. You've probably written code like this:

```javascript
// The callback hell we've all experienced
getData(function(a) {
  getMoreData(a, function(b) {
    getEvenMoreData(b, function(c) {
      // Finally do something with c
      console.log(c);
    });
  });
});
```

Promises were created to solve this mess. But here's the thing - **Promises are just a pattern for managing asynchronous operations**. At their core, they're state machines with three possible states and some rules about transitions.

That's it. Really.

---

## 📖 The Complete Implementation (What We're Building)

Let me show you what we're building first, then we'll break it down piece by piece:

```typescript
enum PromiseState {
  PENDING = "pending",
  FULFILLED = "fulfilled", 
  REJECTED = "rejected",
}

class MyPromise<T, K> {
  private _state: PromiseState = PromiseState.PENDING;
  private _value?: T;
  private _reason?: K;

  private _successHandlers: ((val: T) => void)[] = [];
  private _failureHandlers: ((err: K) => void)[] = [];
  private _finallyHandlers: (() => void)[] = [];

  constructor(executor: (resolve: (val: T) => void, reject: (err: K) => void) => void) {
    try {
      executor(this._resolve.bind(this), this._reject.bind(this));
    } catch (err) {
      this._reject(err as K);
    }
  }

  public then(handler: (val: T) => void) {
    if (this._state === PromiseState.FULFILLED && this._value !== undefined) {
      queueMicrotask(() => handler(this._value as T));
    } else {
      this._successHandlers.push(handler);
    }
    return this;
  }

  public catch(handler: (err: K) => void) {
    if (this._state === PromiseState.REJECTED && this._reason !== undefined) {
      queueMicrotask(() => handler(this._reason as K));
    } else {
      this._failureHandlers.push(handler);
    }
    return this;
  }

  public finally(handler: () => void) {
    if (this._state !== PromiseState.PENDING) {
      queueMicrotask(handler);
    } else {
      this._finallyHandlers.push(handler);
    }
    return this;
  }

  private _resolve(val: T) {
    if (this._state !== PromiseState.PENDING) return;
    this._state = PromiseState.FULFILLED;
    this._value = val;
    queueMicrotask(() => {
      this._successHandlers.forEach(fn => fn(val));
      this._finallyHandlers.forEach(fn => fn());
    });
  }

  private _reject(err: K) {
    if (this._state !== PromiseState.PENDING) return;
    this._state = PromiseState.REJECTED;
    this._reason = err;
    queueMicrotask(() => {
      this._failureHandlers.forEach(fn => fn(err));
      this._finallyHandlers.forEach(fn => fn());
    });
  }
}
```

Don't worry if this looks overwhelming right now. We're going to walk through every single line together.

---

## 🔧 TypeScript Fundamentals (The Building Blocks) {#typescript-fundamentals}

Alright, let's start with the TypeScript concepts. I know, I know - you want to get to the Promise stuff. But trust me, understanding these fundamentals will make everything else click.

### Enums: More Than Just Constants

```typescript
enum PromiseState {
  PENDING = "pending",
  FULFILLED = "fulfilled",
  REJECTED = "rejected",
}
```

**Why are we using an enum here?** 

Think about it - a Promise can be in exactly three states, and once it's fulfilled or rejected, it can never change. An enum is perfect because it gives us:

1. **Type safety** - TypeScript won't let us accidentally use "fullfilled" (with two l's)
2. **IntelliSense** - Your editor will autocomplete the options
3. **Readable debugging** - When you console.log the state, you see "pending" instead of 0

Here's what happens behind the scenes:
```javascript
// This TypeScript enum becomes this JavaScript object:
var PromiseState;
(function (PromiseState) {
    PromiseState["PENDING"] = "pending";
    PromiseState["FULFILLED"] = "fulfilled";
    PromiseState["REJECTED"] = "rejected";
})(PromiseState || (PromiseState = {}));
```

### Generics: The Real Game Changer

```typescript
class MyPromise<T, K> {
```

**Okay, what's this `<T, K>` business?**

Imagine you're building a box, but you don't know what you'll put in it yet. Generics let you say "this box can hold any type, but once you decide, everything has to match."

- `T` = Type of the success value
- `K` = Type of the error

Here's why this is brilliant:

```typescript
// A Promise that resolves to a number, rejects with a string
const numPromise = new MyPromise<number, string>((res, rej) => {
  res(42);        // ✅ TypeScript knows this should be a number
  rej("Error!");  // ✅ TypeScript knows this should be a string
});

// A Promise that resolves to a User object, rejects with an Error
interface User { name: string; age: number; }
const userPromise = new MyPromise<User, Error>((res, rej) => {
  res({ name: "John", age: 30 });  // ✅ Must be a User object
  rej(new Error("Failed"));       // ✅ Must be an Error instance
});
```

Without generics, you'd have to use `any` everywhere, and you'd lose all type safety. With generics, you get the best of both worlds.

### Private vs Public: Protecting Your Implementation

```typescript
private _state: PromiseState = PromiseState.PENDING;
private _value?: T;
private _reason?: K;
```

**Why are these private?**

Imagine if anyone could do this:
```typescript
const promise = new MyPromise<string, string>((res) => res("Hello"));
promise._state = PromiseState.REJECTED;  // 😱 Breaking the Promise contract!
```

By making these private, we ensure that:
- The state can only change through proper methods (`_resolve`, `_reject`)
- The Promise contract is maintained
- Users interact with the clean public API

### Optional Properties: Handling the Unknown

```typescript
private _value?: T;
private _reason?: K;
```

The `?` means "this might be undefined". Why? Because when a Promise is created, it doesn't have a value or reason yet. It's pending!

```typescript
// When created: _value is undefined
// After resolve("hello"): _value is "hello"
// After reject("error"): _reason is "error" 
```

---

## 🏗️ Building Our Promise Step by Step {#building-our-promise}

Now let's build this thing together, starting from the constructor.

### Step 1: The Constructor (Where It All Begins)

```typescript
constructor(executor: (resolve: (val: T) => void, reject: (err: K) => void) => void) {
  try {
    executor(this._resolve.bind(this), this._reject.bind(this));
  } catch (err) {
    this._reject(err as K);
  }
}
```

**Let's break this down like we're debugging:**

1. **The executor parameter**: This is the function you pass when creating a Promise
   ```typescript
   new MyPromise((resolve, reject) => {
     // This function is the "executor"
   });
   ```

2. **The type signature**: `(resolve: (val: T) => void, reject: (err: K) => void) => void`
   - "Give me a function that takes two parameters: resolve and reject"
   - "Both resolve and reject are functions themselves" 
   - "The whole thing returns nothing (void)"

3. **The `.bind(this)` magic**: 
   ```typescript
   // Without .bind(this):
   executor(this._resolve, this._reject);
   // Inside executor, when you call resolve(), 'this' would be undefined
   
   // With .bind(this):
   executor(this._resolve.bind(this), this._reject.bind(this));
   // Now 'this' inside _resolve refers to our Promise instance
   ```

4. **The try-catch**: If your executor throws an error synchronously, we catch it and reject the Promise automatically.

**Real-world example:**
```typescript
const promise = new MyPromise<string, string>((resolve, reject) => {
  // If this throws, the Promise automatically rejects
  throw new Error("Something went wrong!");
});
```

### Step 2: The Then Method (Where Handlers Live)

```typescript
public then(handler: (val: T) => void) {
  if (this._state === PromiseState.FULFILLED && this._value !== undefined) {
    queueMicrotask(() => handler(this._value as T));
  } else {
    this._successHandlers.push(handler);
  }
  return this;
}
```

**This is where the magic happens.** Let me explain the two scenarios:

**Scenario 1: Promise Already Resolved**
```typescript
const promise = new MyPromise<string, string>((res) => res("Done!"));
// Promise is immediately fulfilled

promise.then(val => console.log(val)); 
// Since it's already fulfilled, execute handler immediately
```

**Scenario 2: Promise Still Pending**  
```typescript
const promise = new MyPromise<string, string>((res) => {
  setTimeout(() => res("Done!"), 1000); // Resolves after 1 second
});

promise.then(val => console.log(val));
// Since it's pending, store handler for later
```

**Why `queueMicrotask()`?** This ensures handlers run asynchronously, just like native Promises. More on this later!

**Why `return this`?** Method chaining! This lets you do:
```typescript
promise.then(handler1).catch(handler2).finally(handler3);
```

### Step 3: The Resolve Method (The State Changer)

```typescript
private _resolve(val: T) {
  if (this._state !== PromiseState.PENDING) return; // Guard clause
  this._state = PromiseState.FULFILLED;
  this._value = val;
  queueMicrotask(() => {
    this._successHandlers.forEach(fn => fn(val));
    this._finallyHandlers.forEach(fn => fn());
  });
}
```

**Let's trace through this:**

1. **Guard clause**: `if (this._state !== PromiseState.PENDING) return;`
   - Prevents resolving a Promise twice
   - Once fulfilled or rejected, a Promise never changes

2. **State transition**: Change from PENDING to FULFILLED

3. **Store the value**: Save what the Promise resolved with

4. **Execute all handlers**: 
   - All `.then()` handlers get called with the value
   - All `.finally()` handlers get called (no parameters)
   - Use `queueMicrotask()` for proper async behavior

**Why asynchronously?** Because that's how native Promises work:

```typescript
console.log("1");
Promise.resolve("2").then(val => console.log(val));
console.log("3");
// Output: 1, 3, 2 (not 1, 2, 3)
```

---

## 🔍 Walking Through the Code (Like a Debugger) {#code-walkthrough}

Let's trace through a complete example step by step, like we're debugging:

```typescript
const promise = new MyPromise<string, string>((res, rej) => {
  setTimeout(() => res("Hello World!"), 1000);
});

promise.then(val => console.log("Got:", val));
promise.then(val => console.log("Also got:", val));
```

### Timeline: What Happens When

**T=0ms: Constructor Execution**
```
1. Create Promise instance
   - _state = "pending"
   - _value = undefined
   - _successHandlers = []

2. Call executor function
   - setTimeout is set up (will fire in 1000ms)
   - Constructor completes, returns Promise instance
```

**T=1ms: First .then() Call**
```  
1. Check state: "pending" 
2. Add handler to _successHandlers array
   - _successHandlers = [val => console.log("Got:", val)]
3. Return this (same Promise instance)
```

**T=2ms: Second .then() Call**
```
1. Check state: still "pending"
2. Add second handler to _successHandlers array  
   - _successHandlers = [handler1, handler2]
3. Return this
```

**T=1000ms: Timer Fires**
```
1. resolve("Hello World!") is called
2. Guard clause: state is "pending", so continue
3. _state = "fulfilled"  
4. _value = "Hello World!"
5. queueMicrotask() schedules handler execution
```

**T=1000ms + 1 microtask: Handlers Execute**
```
1. handler1 executes: console.log("Got:", "Hello World!")
2. handler2 executes: console.log("Also got:", "Hello World!")
3. Any finally handlers would execute here
```

**The beautiful part?** All handlers get the same value, and they execute in the order they were added. This is why Promises are so reliable!

---

## 🧠 Memory & Execution (What Actually Happens) {#execution-flow}

Let's talk about what's happening in memory and how the event loop works.

### Memory Layout

When you create a Promise, here's what's in memory:

```
MyPromise Instance
├── _state: "pending"
├── _value: undefined  
├── _reason: undefined
├── _successHandlers: [] ← Array of functions waiting to execute
├── _failureHandlers: []
└── _finallyHandlers: []
```

As you call `.then()`, we're literally storing your callback functions:

```typescript
promise.then(val => console.log("First:", val));
promise.then(val => console.log("Second:", val));

// Memory now looks like:
// _successHandlers: [
//   val => console.log("First:", val),
//   val => console.log("Second:", val)
// ]
```

### The Event Loop Connection

**Here's where it gets interesting.** JavaScript has different types of async tasks:

1. **Call Stack** - Regular synchronous code
2. **Microtask Queue** - Promises, queueMicrotask()  
3. **Macrotask Queue** - setTimeout, setInterval, I/O

**The execution order:**
```
Call Stack (sync code) → Microtask Queue → Macrotask Queue
```

Let's see this in action:

```typescript
console.log("1");                    // Call stack
setTimeout(() => console.log("2"), 0); // Macrotask queue  
queueMicrotask(() => console.log("3")); // Microtask queue
console.log("4");                    // Call stack

// Output: 1, 4, 3, 2
```

**Why does this matter for Promises?**

```typescript
console.log("Start");

const promise = new MyPromise<string, string>((res) => {
  res("Done");  // This happens synchronously
});

promise.then(val => console.log("Promise:", val)); // Microtask

setTimeout(() => console.log("Timeout"), 0); // Macrotask

console.log("End");

// Output: Start, End, Promise: Done, Timeout
```

The Promise handler runs before the setTimeout because microtasks have higher priority!

### Handler Array Management

**Here's a detail most people miss:** What happens to the handler arrays after a Promise resolves?

```typescript
// When Promise is pending:
_successHandlers = [handler1, handler2, handler3];

// When Promise resolves:
// 1. All handlers execute
// 2. Arrays still contain the handlers (memory not freed)
// 3. Future .then() calls execute immediately
```

**In production code**, you might want to clear these arrays after execution to prevent memory leaks:

```typescript
private _resolve(val: T) {
  if (this._state !== PromiseState.PENDING) return;
  this._state = PromiseState.FULFILLED;
  this._value = val;
  queueMicrotask(() => {
    this._successHandlers.forEach(fn => fn(val));
    this._finallyHandlers.forEach(fn => fn());
    // Optional: Clear arrays to free memory
    this._successHandlers = [];
    this._finallyHandlers = [];
  });
}
```

---

## ⚡ TypeScript Magic Explained {#typescript-features}

Now let's dive into the TypeScript-specific features that make this implementation type-safe and developer-friendly.

### Type Assertions: When You Know Better Than TypeScript

```typescript
this._reject(err as K);
handler(this._value as T);
```

**What's happening with `as K` and `as T`?**

Sometimes TypeScript can't infer types perfectly. Type assertions are like saying "Trust me, I know what type this is."

```typescript
// TypeScript thinks 'err' might be any type from the catch block
catch (err) {
  this._reject(err as K); // "I promise this is type K"
}

// TypeScript thinks '_value' might be undefined
handler(this._value as T); // "I know this is defined because I checked the state"
```

**When to use them:**
- ✅ When you have more information than TypeScript can infer
- ✅ When you've already done runtime checks  
- ❌ Never use them to bypass legitimate type errors
- ❌ Avoid them in favor of proper type guards when possible

### Function Type Signatures: The Art of Describing Functions

```typescript
private _successHandlers: ((val: T) => void)[] = [];
```

**Let's decode this monster:**

1. `(val: T) => void` - A function that takes a parameter of type T and returns nothing
2. `((val: T) => void)[]` - An array of such functions
3. `= []` - Initialize as empty array

**Why this syntax?** Because functions are first-class objects in JavaScript, and TypeScript needs to describe their shape.

**Equivalent ways to write this:**
```typescript
// Method 1: Inline (what we used)
private _successHandlers: ((val: T) => void)[] = [];

// Method 2: Type alias
type SuccessHandler<T> = (val: T) => void;
private _successHandlers: SuccessHandler<T>[] = [];

// Method 3: Interface  
interface ISuccessHandler<T> {
  (val: T): void;
}
private _successHandlers: ISuccessHandler<T>[] = [];
```

### Strict Null Checks: Embracing the Void

```typescript
if (this._state === PromiseState.FULFILLED && this._value !== undefined) {
```

**Why the `!== undefined` check?**

With TypeScript's strict null checks enabled, optional properties have union types:

```typescript
private _value?: T;  // Type is actually T | undefined
```

TypeScript forces you to handle the undefined case:

```typescript
// ❌ This would cause a TypeScript error
handler(this._value); // Error: Object is possibly 'undefined'

// ✅ This works
if (this._value !== undefined) {
  handler(this._value); // TypeScript knows it's defined now
}
```

This catches bugs at compile time instead of runtime!

### Generic Constraints: What We Could Add

Our implementation is pretty flexible, but sometimes you want to constrain your generics:

```typescript
// Only allow types that extend Error for rejection
class BetterPromise<T, K extends Error> {
  // Now K must be an Error or subclass
}

// Usage:
const promise = new BetterPromise<string, TypeError>((res, rej) => {
  rej(new TypeError("Must be TypeError"));  // ✅ 
  rej("string error");                      // ❌ TypeScript error
});
```

---

## ⚖️ How It Compares to Real Promises {#native-comparison}

Let's be honest about what our implementation does well and where it falls short.

### What We Nailed ✅

**1. State Management**
```typescript
// Our implementation correctly prevents this:
const promise = new MyPromise<string, string>((res, rej) => {
  res("first");
  res("second"); // Ignored - Promise already fulfilled
  rej("error");  // Ignored - Promise already fulfilled
});
```

**2. Asynchronous Handler Execution**  
```typescript
// Handlers always execute asynchronously
console.log("1");
promise.then(val => console.log("2"));
console.log("3");
// Output: 1, 3, 2 ✅ (same as native Promises)
```

**3. Multiple Handler Support**
```typescript
// You can attach multiple handlers
promise.then(val => console.log("Handler 1:", val));
promise.then(val => console.log("Handler 2:", val));  
// Both execute when Promise resolves ✅
```

**4. Method Chaining Syntax**
```typescript
// Familiar API that returns `this`
promise.then(handler).catch(handler).finally(handler); ✅
```

### What's Missing (And Why) ❌

**1. Value Transformation**
```typescript
// Native Promise:
Promise.resolve(5)
  .then(x => x * 2)    // Returns new Promise<number> with value 10
  .then(x => String(x)) // Returns new Promise<string> with value "10"
  .then(x => console.log(x)); // Logs "10"

// Our implementation:
myPromise.resolve(5)
  .then(x => x * 2)    // Still returns same Promise with value 5
  .then(x => console.log(x)); // Logs 5 (original value)
```

**Why this happens:** Our `.then()` returns `this` instead of a new Promise.

**2. Promise Chaining**
```typescript
// Native Promise:
fetch('/api/user')
  .then(response => response.json()) // Returns new Promise
  .then(user => fetch(`/api/posts/${user.id}`)) // Returns another Promise
  .then(response => response.json())
  .then(posts => console.log(posts));

// Our implementation: Can't do this because we don't return new Promises
```

**3. Error Propagation**
```typescript
// Native Promise:
Promise.resolve(5)
  .then(x => { throw new Error("Oops!"); })
  .catch(err => console.log("Caught:", err.message)); // Works!

// Our implementation:
myPromise.resolve(5)
  .then(x => { throw new Error("Oops!"); }) // Error is not caught!
```

**Why we'd need this:** Each `.then()` should return a new Promise that can be rejected if the handler throws.

### The Complexity Trade-off

**Why doesn't our implementation do everything?**

Building a fully-compliant Promise implementation would require:

```typescript
public then<U>(
  onFulfilled?: (value: T) => U | Promise<U>,
  onRejected?: (reason: K) => U | Promise<U>
): MyPromise<U, K> {
  // Return a NEW Promise
  return new MyPromise<U, K>((resolve, reject) => {
    // Handle value transformation
    // Handle Promise chaining  
    // Handle error catching
    // Handle thenable objects
    // ... hundreds of lines of spec compliance
  });
}
```

Our implementation prioritizes **learning and understanding** over feature completeness. For production code, always use native Promises!

### Performance Comparison

| Feature | Native Promise | Our Implementation |
|---------|----------------|-------------------|
| Memory per instance | ~40-60 bytes | ~200+ bytes (due to arrays) |
| Resolution speed | Optimized C++ | Interpreted JavaScript |
| Spec compliance | 100% | ~30% |
| Learning value | 0% | 100% 😉 |

---

## 🚨 Common Mistakes (Learn from My Pain) {#pitfalls}

Let me share the mistakes I made (and you probably will too) when building this.

### Mistake #1: Forgetting Asynchronous Execution

**What I did wrong initially:**
```typescript
public then(handler: (val: T) => void) {
  if (this._state === PromiseState.FULFILLED) {
    handler(this._value as T); // ❌ Synchronous execution
  }
  // ...
}
```

**Why this breaks everything:**
```typescript
console.log("1");
promise.then(val => console.log("2"));
console.log("3");
// Wrong output: 1, 2, 3
// Should be: 1, 3, 2
```

**The fix:**
```typescript
public then(handler: (val: T) => void) {
  if (this._state === PromiseState.FULFILLED) {
    queueMicrotask(() => handler(this._value as T)); // ✅ Async execution
  }
  // ...
}
```

### Mistake #2: Not Guarding Against Multiple Resolutions

**The problem:**
```typescript
const promise = new MyPromise<string, string>((res, rej) => {
  res("first");
  setTimeout(() => res("second"), 100); // Should be ignored
});
```

**What happens without guards:**
```typescript
private _resolve(val: T) {
  // No guard clause - this is bad!
  this._state = PromiseState.FULFILLED;
  this._value = val; // Overwrites previous value!
  // Handlers execute twice!
}
```

**The fix:**
```typescript
private _resolve(val: T) {
  if (this._state !== PromiseState.PENDING) return; // ✅ Guard clause
  // Rest of the method...
}
```

### Mistake #3: Misunderstanding `this` Context

**The binding problem:**
```typescript
constructor(executor) {
  executor(this._resolve, this._reject); // ❌ Wrong context
}

// When executor calls resolve():
resolve("value"); // 'this' inside _resolve is undefined!
```

**The fix:**
```typescript
constructor(executor) {
  executor(this._resolve.bind(this), this._reject.bind(this)); // ✅ Correct context
}
```

**Alternative solutions:**
```typescript
// Method 1: Arrow functions (but creates new function each time)
constructor(executor) {
  executor(
    (val) => this._resolve(val),
    (err) => this._reject(err)
  );
}

// Method 2: Bind in class properties (modern approach)
private _resolve = (val: T) => {
  // Arrow function automatically binds 'this'
}
```

### Mistake #4: Type Assertion Abuse

**What I used to do:**
```typescript
private _reject(err: K) {
  this._failureHandlers.forEach(fn => fn(err as any)); // ❌ Lazy type assertion
}
```

**Better approach:**
```typescript
private _reject(err: K) {
  this._failureHandlers.forEach(fn => fn(err)); // ✅ Trust the type system
}
```

**When type assertions are okay:**
```typescript
// ✅ When you've done runtime checks
if (this._state === PromiseState.FULFILLED && this._value !== undefined) {
  handler(this._value as T); // We know it's defined
}

// ✅ When dealing with external libraries
catch (err) {
  this._reject(err as K); // We define what K should be
}
```

### Mistake #5: Memory Leaks with Handler Arrays

**The problem:**
```typescript
// Promise resolves, but arrays still hold references
promise.then(val => someHugeObject.process(val));
// someHugeObject can't be garbage collected!
```

**Production-ready fix:**
```typescript
private _resolve(val: T) {
  if (this._state !== PromiseState.PENDING) return;
  this._state = PromiseState.FULFILLED;
  this._value = val;
  
  queueMicrotask(() => {
    // Execute handlers
    const handlers = this._successHandlers.slice(); // Copy array
    const finallyHandlers = this._finallyHandlers.slice();
    
    // Clear arrays to free memory
    this._successHandlers = [];
    this._finallyHandlers = [];
    
    // Execute from copies
    handlers.forEach(fn => fn(val));
    finallyHandlers.forEach(fn => fn());
  });
}
```

---

## 🚀 Advanced Concepts (For the Curious) {#advanced-concepts}

If you've made it this far, you're hungry for more. Let's dive into a few deeper topics that really separate the pros from the novices.

### 1. Microtask Queue Deep Dive: The Priority Lane

Here's a classic JavaScript interview question. What does this code log?

```typescript
console.log("1. First");
queueMicrotask(() => console.log("2. Microtask"));
setTimeout(() => console.log("3. Macrotask (Timer)"), 0);
console.log("4. Last");
```

Think about it for a second... got an answer? The output is: **1, 4, 2, 3**.

**Why this order?**

Think of the JavaScript event loop like an incredibly efficient office worker:

1. **The Call Stack (The Current Task)**: The worker first completes everything on their immediate desk. That's all the synchronous code. So, `console.log("1")` and `console.log("4")` run right away.

2. **The Microtask Queue (Urgent Sticky Notes)**: After finishing the immediate task, the worker checks for any urgent sticky notes on their monitor. These must be cleared before anything else. Our `queueMicrotask` and promise `.then()` handlers live here. So, `console.log("2")` runs next.

3. **The Macrotask Queue (The Inbox)**: Only when the desk is clear and all sticky notes are gone does the worker check their main inbox for new tasks. This is where `setTimeout`, `setInterval`, and I/O events wait. So, `console.log("3")` runs last.

Understanding this priority is crucial for debugging complex asynchronous code.

### 2. The Promise Resolution Algorithm: The Rulebook

When you call `_resolve(someValue)`, it's not always a simple state change. Native promises follow a strict set of rules called the **Promise Resolution Procedure**. It's like a detailed flowchart for handling whatever you throw at it.

Here's our simplified version of that algorithm:

1. **Check the State**: If the promise isn't PENDING anymore, just stop. Do nothing. This enforces the "settle-once" rule.

2. **Update the State**: Flip the switch from PENDING to FULFILLED or REJECTED. This is the point of no return.

3. **Store the Value**: Tuck away the final value or reason. It's now immutable.

4. **Schedule the Handlers**: Tell the microtask queue, "Hey, I've got some functions that need to run ASAP." This guarantees asynchronicity.

5. **Execute the Handlers**: Once the microtask is picked up, run through the waiting list (`_successHandlers` or `_failureHandlers`) and call every function with the stored value.

This step-by-step process is what makes promises so predictable and reliable.

### 3. Type Inference in Action: Letting TypeScript Be Your Copilot

One of the most beautiful things about using generics is how TypeScript's inference works in your favor. You set the types once, and TypeScript remembers them everywhere else.

Check this out:

```typescript
// We declare that T is `string` and K is `Error`.
const stringPromise = new MyPromise<string, Error>((res, rej) => {
  res("hello"); // ✅ Correct! TypeScript expects a string.
  // res(123); // ❌ TypeScript would scream at you here!

  rej(new Error("Failed")); // ✅ Correct! TypeScript expects an Error.
});

stringPromise.then(val => {
  // What's the type of `val` here?
  // You don't have to guess! TypeScript *knows* it's a string.
  console.log(val.toUpperCase()); // So you get full autocomplete and type-checking!
});
```

This is the magic of generics. You write a flexible, reusable component (`MyPromise`), and TypeScript ensures that whenever you use it, you're doing so safely and correctly. It's like having a pair programmer who never forgets a type.

---

## ✨ Key Takeaways {#takeaways}

If you remember only a few things from this guide, make them these:

🛡️ **Promises are State Machines**: At their core, they are simple objects that transition from PENDING to either FULFILLED or REJECTED. This transition can only happen once, which is their fundamental guarantee.

🔄 **Asynchronicity is a Contract**: Promise handlers (`.then`, `.catch`) never run in the same turn of the event loop as the code that attached them. This is enforced by the microtask queue and provides predictable execution order.

🎯 **Generics Provide Power and Safety**: They allow you to build components that are both highly reusable and type-safe, preventing common bugs before your code even runs.

🔗 **The Real Power is in Chaining**: The biggest feature we skipped is `.then()` returning a new Promise. This is what enables value transformation and the elegant chaining you see in modern async code.

🎓 **This is a Model for Learning**: Our `MyPromise` is designed for clarity, not performance. Use it to build your mental model, but always use native `Promise` in your production applications!

---

## 🤝 Contributing

This guide is for the community. If you found a bug, have a suggestion, or want to make an improvement, your contribution is welcome!

- **Found a typo or a bug?** 👉 Open an issue on the repository.
- **Want to add a new section?** 👉 Submit a Pull Request.

---

## 📄 License

This educational content is provided under the MIT License. Feel free to use, modify, and share it with anyone who might find it helpful.

---

**And that's a wrap!** I hope building this from scratch has demystified Promises for you. The goal was to replace any "magic" with a solid understanding of the mechanics. Now when you write async code, you'll know exactly what's happening under the hood.

If this guide helped you, please give the repository a ⭐ to show your support and help others find it!

**Happy coding!** 🚀
