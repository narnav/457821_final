# Lumo – Python Basics Exercises (v1)

This document contains all exercises for the Python Basics curriculum.

Each module includes three categories:
- **Guided Practice** – predict, modify, or complete existing code
- **Debugging Exercises** – analyze and fix broken or misleading code
- **Independent Mini Tasks** – small, constrained programs written from scratch

---

## Module 1 – Thinking Like a Programmer

### Guided Practice

#### Exercise 1.1: Predict the Output

**Description:** Read the code and predict what will appear on screen.

**Task:** Without running the code, write down exactly what this program will print.

```python
print("Hello")
print("World")
print("!")
```

**Constraints:** Do not run the code until you have written your prediction.

---

#### Exercise 1.2: Line by Line

**Description:** Explain what each line does in plain English.

**Task:** For each numbered line below, write one sentence describing what that line does.

```python
print("My name is Lumo")    # Line 1
print(5 + 3)                # Line 2
print("5 + 3")              # Line 3
```

**Constraints:** Your explanations should be understandable by someone who has never seen code.

---

#### Exercise 1.3: Order Matters

**Description:** Understand how execution order affects output.

**Task:** Predict the output. Then, reorder the print statements so the output reads "One Two Three" on separate lines.

```python
print("Three")
print("One")
print("Two")
```

**Constraints:** Do not add or remove any lines.

---

#### Exercise 1.4: What Changed?

**Description:** Compare two similar programs.

**Task:** These two programs look almost identical. Predict what each one prints, then explain the difference.

Program A:
```python
print("10 + 5")
```

Program B:
```python
print(10 + 5)
```

**Constraints:** Write your predictions before running either program.

---

### Debugging Exercises

#### Exercise 1.5: Spot the Problem

**Description:** Find and explain the error.

**Task:** This code is supposed to print a greeting, but something is wrong. Identify the problem and explain what needs to change.

```python
print("Hello, learner!)
```

**Constraints:** Explain the error in plain English before fixing it.

---

#### Exercise 1.6: Missing Pieces

**Description:** Complete the broken code.

**Task:** This program should print three lines, but it has errors. Find all problems and describe how to fix them.

```python
print("Line 1"
print "Line 2")
print("Line 3)
```

**Constraints:** List each error separately.

---

#### Exercise 1.7: Wrong Output

**Description:** The code runs but gives unexpected results.

**Task:** This code is supposed to display the result of adding 20 and 30. It runs without error, but the output is wrong. Explain why.

```python
print("20 + 30")
```

**Constraints:** Explain what the programmer probably wanted vs. what actually happens.

---

### Independent Mini Tasks

#### Exercise 1.8: Your First Program

**Description:** Write a program that introduces yourself.

**Task:** Write a program that prints three lines:
1. Your name
2. Your favorite color
3. A number you like

**Constraints:** Use exactly three print statements.

---

#### Exercise 1.9: Simple Math Display

**Description:** Show a calculation and its result.

**Task:** Write a program that prints:
- The text "7 times 8 equals"
- The actual result of 7 times 8

**Constraints:** The result must be calculated by Python, not typed as text.

---

#### Exercise 1.10: Message Builder

**Description:** Create a multi-line message.

**Task:** Write a program that prints a simple 4-line poem or message of your choice.

**Constraints:** Each line must use a separate print statement.

---

## Module 2 – Variables and Data Types

### Guided Practice

#### Exercise 2.1: Trace the Variable

**Description:** Follow how a variable changes over time.

**Task:** After each line runs, write down the current value of `x`.

```python
x = 5
x = x + 3
x = x * 2
x = 1
```

**Constraints:** Write four values, one after each line.

---

#### Exercise 2.2: What Type Is It?

**Description:** Identify data types.

**Task:** For each variable below, state whether it holds an integer, float, string, or boolean.

```python
a = 42
b = "42"
c = 42.0
d = True
e = "True"
f = 3.14
```

**Constraints:** Do not run the code. Reason through each one.

---

#### Exercise 2.3: Name That Variable

**Description:** Evaluate variable naming choices.

**Task:** For each variable name below, state whether it is good or bad, and explain why.

```python
x = 25
age = 25
AGE = 25
user_age = 25
a = 25
myAge = 25
25_age = 25
```

**Constraints:** Consider readability and Python naming rules.

---

#### Exercise 2.4: Predict the Swap

**Description:** Understand variable reassignment.

**Task:** What are the final values of `a` and `b`? Trace each step.

```python
a = 10
b = 20
a = b
b = a
```

**Constraints:** Write your prediction before running the code. Explain why this might not do what you expect.

---

#### Exercise 2.5: String or Number?

**Description:** Understand type differences in operations.

**Task:** Predict the output of each print statement. Explain any differences.

```python
x = "5"
y = 5

print(x + x)
print(y + y)
```

**Constraints:** Do not run until you have written both predictions.

---

### Debugging Exercises

#### Exercise 2.6: Type Mismatch

**Description:** Fix a type error.

**Task:** This code crashes with an error. Explain why, then fix it.

```python
age = "25"
next_year = age + 1
print(next_year)
```

**Constraints:** The fixed code should print 26.

---

#### Exercise 2.7: Overwritten Variable

**Description:** Find the accidental overwrite.

**Task:** This code is supposed to calculate the total price. Find the bug.

```python
price = 100
tax = 15
price = tax
total = price + tax
print(total)
```

**Constraints:** Explain what the programmer probably meant to do.

---

#### Exercise 2.8: Unclear Names

**Description:** Improve confusing variable names.

**Task:** This code works, but the variable names make it hard to understand. Rename the variables to make the code clearer.

```python
a = 50
b = 40
c = a + b
d = c / 2
print(d)
```

**Constraints:** Do not change the logic, only the names.

---

#### Exercise 2.9: Broken Calculation

**Description:** Fix incorrect arithmetic.

**Task:** This code should calculate the average of three numbers (10, 20, 30). The answer should be 20, but it gives the wrong result. Fix it.

```python
num1 = 10
num2 = 20
num3 = 30
average = num1 + num2 + num3 / 3
print(average)
```

**Constraints:** Hint: Think about order of operations.

---

### Independent Mini Tasks

#### Exercise 2.10: Temperature Converter

**Description:** Convert temperature from Celsius to Fahrenheit.

**Task:** Write a program that:
1. Stores a temperature in Celsius in a variable
2. Converts it to Fahrenheit using the formula: F = C * 9/5 + 32
3. Prints the result

**Constraints:** Use descriptive variable names.

---

#### Exercise 2.11: Rectangle Calculator

**Description:** Calculate area and perimeter.

**Task:** Write a program that:
1. Stores a rectangle's width and height in variables
2. Calculates the area (width * height)
3. Calculates the perimeter (2 * width + 2 * height)
4. Prints both results

**Constraints:** Use four separate variables: width, height, area, perimeter.

---

#### Exercise 2.12: Personal Info Card

**Description:** Store and display information.

**Task:** Write a program that:
1. Stores your name, age, and city in separate variables
2. Prints each piece of information on its own line

**Constraints:** Use appropriate data types for each variable.

---

## Module 3 – Conditions and Logical Thinking

### Guided Practice

#### Exercise 3.1: Which Branch Runs?

**Description:** Trace conditional execution.

**Task:** For each value of `score`, predict which message will print.

```python
score = ___

if score >= 90:
    print("Excellent")
elif score >= 70:
    print("Good")
elif score >= 50:
    print("Pass")
else:
    print("Fail")
```

Test with: score = 95, score = 70, score = 45, score = 85

**Constraints:** Write all four predictions before running the code.

---

#### Exercise 3.2: True or False?

**Description:** Evaluate boolean expressions.

**Task:** Without running code, determine if each expression is True or False.

```python
5 > 3
10 == "10"
7 != 7
15 >= 15
3 < 3
"apple" == "apple"
```

**Constraints:** Write your answers before checking in Python.

---

#### Exercise 3.3: Combine Conditions

**Description:** Understand logical operators.

**Task:** Predict True or False for each expression, given x = 10 and y = 5.

```python
x > 5 and y > 3
x > 15 or y < 10
not x == 10
x > 5 and y > 10
not (x < y)
```

**Constraints:** Evaluate step by step, showing your reasoning.

---

#### Exercise 3.4: Complete the Condition

**Description:** Fill in missing conditions.

**Task:** Complete the blank conditions to make the code work correctly.

```python
age = 17

if ___:
    print("Child")
elif ___:
    print("Teenager")
else:
    print("Adult")
```

The rules: Child = under 13, Teenager = 13 to 17, Adult = 18 and over.

**Constraints:** Age 17 should print "Teenager".

---

### Debugging Exercises

#### Exercise 3.5: Assignment vs Comparison

**Description:** Fix a common beginner error.

**Task:** This code has a bug that causes wrong behavior. Find and fix it.

```python
password = "secret123"
user_input = "secret123"

if password = user_input:
    print("Access granted")
else:
    print("Access denied")
```

**Constraints:** Explain the difference between = and ==.

---

#### Exercise 3.6: Indentation Error

**Description:** Fix incorrect indentation.

**Task:** This code should print different messages based on temperature, but it has indentation problems. Fix it.

```python
temperature = 35

if temperature > 30:
print("Hot day")
elif temperature > 20:
print("Nice day")
else:
print("Cold day")
```

**Constraints:** All print statements should be properly indented.

---

#### Exercise 3.7: Missing Colon

**Description:** Find syntax errors in conditionals.

**Task:** This code has multiple syntax errors. Find and fix all of them.

```python
number = 15

if number > 10
    print("Big")
elif number > 5
    print("Medium")
else
    print("Small")
```

**Constraints:** Count how many errors you find.

---

#### Exercise 3.8: Logic Error

**Description:** Fix conditions that don't match the requirements.

**Task:** This code should check if a number is between 1 and 100 (inclusive). It doesn't work correctly. Fix it.

```python
number = 50

if number > 1 and number < 100:
    print("Valid range")
else:
    print("Out of range")
```

**Constraints:** The numbers 1 and 100 should both be considered valid.

---

#### Exercise 3.9: Overlapping Conditions

**Description:** Fix conditions that never execute.

**Task:** The "Good" message never prints, no matter what score you use. Explain why and fix it.

```python
score = 75

if score >= 50:
    print("Pass")
elif score >= 70:
    print("Good")
elif score >= 90:
    print("Excellent")
```

**Constraints:** Reorder or rewrite conditions so all three messages are possible.

---

### Independent Mini Tasks

#### Exercise 3.10: Even or Odd

**Description:** Check if a number is even or odd.

**Task:** Write a program that:
1. Stores a number in a variable
2. Prints "Even" if the number is divisible by 2
3. Prints "Odd" otherwise

**Constraints:** Use the modulo operator (%).

---

#### Exercise 3.11: Sign Checker

**Description:** Determine if a number is positive, negative, or zero.

**Task:** Write a program that:
1. Stores a number in a variable
2. Prints "Positive" if greater than zero
3. Prints "Negative" if less than zero
4. Prints "Zero" if equal to zero

**Constraints:** Use if/elif/else.

---

#### Exercise 3.12: Grade Calculator

**Description:** Convert a numeric score to a letter grade.

**Task:** Write a program that:
1. Stores a score (0-100) in a variable
2. Prints the letter grade based on:
   - 90-100: A
   - 80-89: B
   - 70-79: C
   - 60-69: D
   - Below 60: F

**Constraints:** Handle all possible scores.

---

#### Exercise 3.13: Login Validator

**Description:** Check username and password.

**Task:** Write a program that:
1. Stores correct username and password in variables
2. Stores user input in separate variables
3. Prints "Login successful" only if both match
4. Prints "Login failed" otherwise

**Constraints:** Use the `and` operator.

---

## Module 4 – Loops and Repetition

### Guided Practice

#### Exercise 4.1: Count the Iterations

**Description:** Predict how many times a loop runs.

**Task:** For each loop, predict how many times "Hello" will print.

Loop A:
```python
for i in range(5):
    print("Hello")
```

Loop B:
```python
for i in range(2, 7):
    print("Hello")
```

Loop C:
```python
for i in range(0, 10, 2):
    print("Hello")
```

**Constraints:** Write your predictions before running.

---

#### Exercise 4.2: Trace the Values

**Description:** Follow loop variable changes.

**Task:** Write down every value of `i` that gets printed.

```python
for i in range(3, 8):
    print(i)
```

**Constraints:** List all values in order.

---

#### Exercise 4.3: While Loop Trace

**Description:** Trace a while loop step by step.

**Task:** Trace through this loop. Write the value of `count` before each iteration, and the final value when the loop ends.

```python
count = 0
while count < 4:
    print(count)
    count = count + 1
```

**Constraints:** Also state how many times the loop body runs.

---

#### Exercise 4.4: Range Parameters

**Description:** Understand range() arguments.

**Task:** Write the output of each range:

```python
list(range(5))
list(range(1, 6))
list(range(0, 10, 3))
list(range(10, 0, -2))
```

**Constraints:** Predict all outputs before running.

---

### Debugging Exercises

#### Exercise 4.5: Infinite Loop

**Description:** Identify and fix an infinite loop.

**Task:** This loop never stops. Explain why and fix it.

```python
x = 1
while x < 10:
    print(x)
```

**Constraints:** The loop should print 1 through 9.

---

#### Exercise 4.6: Off-By-One Error

**Description:** Fix a loop that runs the wrong number of times.

**Task:** This code should print numbers 1 through 10, but it doesn't. Fix it.

```python
for i in range(10):
    print(i)
```

**Constraints:** The output should be: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 (each on a new line).

---

#### Exercise 4.7: Wrong Counter Update

**Description:** Fix incorrect counter logic.

**Task:** This loop should count down from 5 to 1, then print "Blast off!". It has a bug. Fix it.

```python
countdown = 5
while countdown > 0:
    print(countdown)
    countdown = countdown + 1
print("Blast off!")
```

**Constraints:** Explain what the bug causes before fixing.

---

#### Exercise 4.8: Loop Never Starts

**Description:** Fix a loop that doesn't execute.

**Task:** This loop is supposed to print "Processing..." five times, but nothing prints. Fix it.

```python
count = 10
while count < 5:
    print("Processing...")
    count = count + 1
```

**Constraints:** Do not change the while condition.

---

### Independent Mini Tasks

#### Exercise 4.9: Sum Calculator

**Description:** Add numbers from 1 to N.

**Task:** Write a program that:
1. Stores a number N in a variable
2. Uses a loop to add all numbers from 1 to N
3. Prints the total sum

**Constraints:** For N=5, the result should be 15 (1+2+3+4+5).

---

#### Exercise 4.10: Multiplication Table

**Description:** Print a multiplication table row.

**Task:** Write a program that:
1. Stores a number in a variable (e.g., 7)
2. Uses a loop to print that number multiplied by 1 through 10
3. Format: "7 x 1 = 7", "7 x 2 = 14", etc.

**Constraints:** Use a for loop with range().

---

#### Exercise 4.11: Count Down Timer

**Description:** Create a countdown display.

**Task:** Write a program that:
1. Starts at a number (e.g., 10)
2. Counts down to 1
3. Prints "Time's up!" at the end

**Constraints:** Use a while loop.

---

#### Exercise 4.12: Star Pattern

**Description:** Print a pattern using loops.

**Task:** Write a program that prints this pattern:
```
*
**
***
****
*****
```

**Constraints:** Use a loop. Do not hard-code each line.

---

#### Exercise 4.13: Find the Total

**Description:** Calculate a running total.

**Task:** Write a program that:
1. Uses a loop to go through these numbers: 10, 20, 30, 40, 50
2. Adds each number to a running total
3. Prints the final total

**Constraints:** Initialize your total variable before the loop.

---

## Module 5 – Functions and Code Organization

### Guided Practice

#### Exercise 5.1: Trace the Function Call

**Description:** Follow function execution.

**Task:** Trace through this code and predict the output.

```python
def greet(name):
    print("Hello, " + name)

greet("Alice")
greet("Bob")
```

**Constraints:** Write your prediction before running.

---

#### Exercise 5.2: Return vs Print

**Description:** Understand the difference between return and print.

**Task:** Predict the output of this code. Explain why.

```python
def add_print(a, b):
    print(a + b)

def add_return(a, b):
    return a + b

result1 = add_print(3, 4)
result2 = add_return(3, 4)

print(result1)
print(result2)
```

**Constraints:** Pay attention to what gets stored in result1 and result2.

---

#### Exercise 5.3: Complete the Function

**Description:** Fill in function bodies.

**Task:** Complete these functions so they work as described.

```python
def double(number):
    # Return the number multiplied by 2
    ___

def is_positive(number):
    # Return True if number is greater than 0, False otherwise
    ___

def get_greeting(name):
    # Return the string "Hello, " followed by the name
    ___
```

**Constraints:** Each function should use return, not print.

---

#### Exercise 5.4: Parameter Passing

**Description:** Trace values through function parameters.

**Task:** Trace through this code. What is the final output?

```python
def modify(x):
    x = x + 10
    return x

value = 5
result = modify(value)
print(value)
print(result)
```

**Constraints:** Explain why `value` has the value it does at the end.

---

### Debugging Exercises

#### Exercise 5.5: Missing Return

**Description:** Fix a function that doesn't return a value.

**Task:** This function is supposed to calculate tax, but it doesn't work correctly. Fix it.

```python
def calculate_tax(price, rate):
    tax = price * rate

total_tax = calculate_tax(100, 0.15)
print("Tax:", total_tax)
```

**Constraints:** The output should show "Tax: 15.0".

---

#### Exercise 5.6: Wrong Return Placement

**Description:** Fix incorrect return statement placement.

**Task:** This function should return the sum of all numbers from 1 to n, but it returns the wrong value. Fix it.

```python
def sum_to_n(n):
    total = 0
    for i in range(1, n + 1):
        total = total + i
        return total
```

**Constraints:** Test with sum_to_n(5), which should return 15.

---

#### Exercise 5.7: Parameter Mismatch

**Description:** Fix function call errors.

**Task:** This code has errors in how the function is called. Fix all problems.

```python
def create_message(greeting, name, punctuation):
    return greeting + ", " + name + punctuation

message1 = create_message("Hello", "Alice")
message2 = create_message("Hi")
message3 = create_message("Welcome", "Bob", "!", "Extra")
```

**Constraints:** Make all three calls work correctly.

---

#### Exercise 5.8: Confused Print and Return

**Description:** Fix confusion between print and return.

**Task:** This code should print the square of 5, but it prints "None". Fix it.

```python
def square(number):
    print(number * number)

result = square(5)
print("The result is:", result)
```

**Constraints:** The function should return the value, and the program should print it once.

---

### Independent Mini Tasks

#### Exercise 5.9: Temperature Function

**Description:** Create a temperature conversion function.

**Task:** Write a function called `celsius_to_fahrenheit` that:
1. Takes a Celsius temperature as a parameter
2. Returns the Fahrenheit equivalent
3. Test it by printing the result for 0, 100, and 37 degrees

**Constraints:** Use the formula: F = C * 9/5 + 32

---

#### Exercise 5.10: Maximum Finder

**Description:** Create a function to find the larger of two numbers.

**Task:** Write a function called `find_max` that:
1. Takes two numbers as parameters
2. Returns the larger one
3. Test it with several pairs of numbers

**Constraints:** Use an if/else statement inside the function.

---

#### Exercise 5.11: Greeting Generator

**Description:** Create a customizable greeting function.

**Task:** Write a function called `make_greeting` that:
1. Takes a name and a time of day ("morning", "afternoon", "evening")
2. Returns an appropriate greeting like "Good morning, Alice!"
3. Test it with different names and times

**Constraints:** Use conditionals to choose the right greeting.

---

#### Exercise 5.12: Simple Calculator Functions

**Description:** Create basic math functions.

**Task:** Write four functions:
1. `add(a, b)` - returns a + b
2. `subtract(a, b)` - returns a - b
3. `multiply(a, b)` - returns a * b
4. `divide(a, b)` - returns a / b

Test each function with sample numbers.

**Constraints:** Each function should return (not print) the result.

---

## Module 6 – Basic Data Structures (Lists & Dictionaries)

### Guided Practice

#### Exercise 6.1: List Indexing

**Description:** Access list elements by index.

**Task:** Given this list, predict what each print statement outputs.

```python
fruits = ["apple", "banana", "cherry", "date", "elderberry"]

print(fruits[0])
print(fruits[2])
print(fruits[-1])
print(fruits[1:3])
```

**Constraints:** Remember that indexing starts at 0.

---

#### Exercise 6.2: Dictionary Access

**Description:** Access dictionary values by key.

**Task:** Predict the output of each print statement.

```python
person = {
    "name": "Alice",
    "age": 25,
    "city": "Boston"
}

print(person["name"])
print(person["age"])
print(person["city"])
```

**Constraints:** Write predictions before running.

---

#### Exercise 6.3: List Modification

**Description:** Trace list changes.

**Task:** After each line, write the current state of the list.

```python
numbers = [1, 2, 3]
numbers.append(4)
numbers[0] = 10
numbers.pop()
numbers.insert(1, 20)
```

**Constraints:** Show the list after each operation.

---

#### Exercise 6.4: Loop Through Collections

**Description:** Iterate over lists and dictionaries.

**Task:** Predict the output of each loop.

Loop A:
```python
colors = ["red", "green", "blue"]
for color in colors:
    print(color)
```

Loop B:
```python
scores = {"math": 90, "science": 85, "english": 88}
for subject in scores:
    print(subject, scores[subject])
```

**Constraints:** Write all outputs in order.

---

### Debugging Exercises

#### Exercise 6.5: Index Out of Range

**Description:** Fix an indexing error.

**Task:** This code crashes. Find and fix the error.

```python
items = ["first", "second", "third"]
print(items[3])
```

**Constraints:** Explain why the error occurs.

---

#### Exercise 6.6: Wrong Key Type

**Description:** Fix dictionary key errors.

**Task:** This code doesn't work as expected. Fix it.

```python
inventory = {
    "apples": 50,
    "oranges": 30
}

print(inventory[apples])
```

**Constraints:** The output should be 50.

---

#### Exercise 6.7: Missing Key

**Description:** Handle a key that doesn't exist.

**Task:** This code crashes because the key doesn't exist. Fix it to print "Unknown" if the key is missing.

```python
person = {"name": "Bob", "age": 30}
print(person["city"])
```

**Constraints:** Use the `.get()` method with a default value.

---

#### Exercise 6.8: Modifying While Iterating

**Description:** Fix a common iteration error.

**Task:** This code is supposed to remove all even numbers, but it doesn't work correctly. Explain the problem and fix it.

```python
numbers = [1, 2, 3, 4, 5, 6, 7, 8]
for num in numbers:
    if num % 2 == 0:
        numbers.remove(num)
print(numbers)
```

**Constraints:** The result should be [1, 3, 5, 7].

---

#### Exercise 6.9: Empty List Check

**Description:** Fix an error with empty lists.

**Task:** This code crashes when the list is empty. Fix it to print "No items" instead.

```python
items = []
print("First item:", items[0])
```

**Constraints:** Use a conditional to check if the list is empty.

---

### Independent Mini Tasks

#### Exercise 6.10: Shopping List Manager

**Description:** Build a simple list-based program.

**Task:** Write a program that:
1. Creates a shopping list with 3 items
2. Adds 2 more items to the end
3. Removes one item
4. Prints the final list and how many items are in it

**Constraints:** Use append(), remove(), and len().

---

#### Exercise 6.11: Student Grades

**Description:** Use a dictionary to store related information.

**Task:** Write a program that:
1. Creates a dictionary storing 3 students and their grades
2. Prints each student's name and grade
3. Calculates and prints the average grade

**Constraints:** Use a loop to iterate through the dictionary.

---

#### Exercise 6.12: Word Counter

**Description:** Count items in a list.

**Task:** Write a program that:
1. Creates a list of words (some repeated)
2. Uses a loop to count how many times each unique word appears
3. Stores the counts in a dictionary
4. Prints the results

**Constraints:** Example input: ["apple", "banana", "apple", "cherry", "banana", "apple"]

---

#### Exercise 6.13: Contact Book

**Description:** Combine lists and dictionaries.

**Task:** Write a program that:
1. Creates a list of dictionaries, where each dictionary represents a contact (name, phone, email)
2. Add at least 3 contacts
3. Write a function that takes a name and returns the contact's phone number
4. Test the function

**Constraints:** Return "Not found" if the name doesn't exist.

---

#### Exercise 6.14: List Statistics

**Description:** Calculate statistics from a list of numbers.

**Task:** Write a program that:
1. Creates a list of at least 10 numbers
2. Uses loops (not built-in functions like sum() or max()) to find:
   - The total sum
   - The largest number
   - The smallest number
   - The average
3. Prints all results

**Constraints:** Write your own logic for each calculation.

---

#### Exercise 6.15: Inventory System

**Description:** Build a product inventory.

**Task:** Write a program that:
1. Creates a dictionary of products with their quantities
2. Writes a function `add_stock(product, amount)` that increases quantity
3. Writes a function `remove_stock(product, amount)` that decreases quantity (but not below 0)
4. Writes a function `check_stock(product)` that returns the current quantity
5. Tests all functions

**Constraints:** Handle the case where a product doesn't exist.

---

## End of Exercises

This document will be updated as the curriculum evolves.
