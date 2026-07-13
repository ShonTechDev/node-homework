const fs = require('fs');
const path = require('path');


// Write a sample file for demonstration
const filePath = path.join(__dirname, "sample-files", "sample.txt");
const fileContent = "Hello, async world!"

fs.writeFileSync(filePath, fileContent);

// 1. Callback style

fs.readFile(filePath, "utf8", (err, content) => {
  if (err) {
    console.log("File read failed:", err.message);
    return;
  }

  console.log("Callback read:", content);
});



  // Callback hell example (test and leave it in comments):
//happens when callbacks are nested inside other callbacks; can make code harder to read

// fs.readFile(filePath, "utf8", (err, content) => {
//   if (err) return console.log(err.message);

//   fs.writeFile(filePath, content, (err) => {
//     if (err) return console.log(err.message);

//     fs.readFile(filePath, "utf8", (err, updatedContent) => {
//       if (err) return console.log(err.message);

//       console.log(updatedContent);
//     });
//   });
// });

  // 2. Promise style

function readTextFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, content) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(content);
    });
  });
}

readTextFile(filePath)
  .then((content) => {
    console.log("Promise read:", content);
  })
  .catch((err) => {
    console.log("Promise read failed:", err.message);
  });

      // 3. Async/Await style

async function run() {
  try {
    const result = await readTextFile(filePath);
    console.log("Async/Await read:", result);
  } catch (err) {
    console.log("Async/Await read failed:", err.message);
  }
}

run();