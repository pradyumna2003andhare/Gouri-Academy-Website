import express from "express";
import axios from "axios";
import pg from "pg";
import multer from "multer";
import path from "path";

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "World",
  password: "Postgres@123",
  port: 5432,
});

db.connect();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/contact", (req, res) => {
  res.render("contact.ejs");
});

app.get("/about", (req, res) => {
  const teachers = [
    { name: "Mr. Sharma", subject: "Mathematics" },
    { name: "Ms. Patel", subject: "Science" },
  ];

  res.render("about.ejs", { teachers });
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const role = req.body.role;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    // Check if user exists
    if (result.rows.length > 0) {
      const user = result.rows[0];

      // Check password
      if (password === user.password) {
        // Redirect to dashboard
        if (role == "student") {
          res.redirect(`/dashboard?name=${user.name}`);
        } else if (role == "teacher") {
          res.redirect(`/teacher_dashboard?name=${user.name}`);
        }
      } else {
        res.send("Incorrect Password");
      }
    } else {
      res.send("User not found");
    }
  } catch (err) {
    console.log(err);

    res.send("Database Error");
  }
});

app.post("/signup", async (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const role = req.body.role;

  try {
    await db.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
      [name, email, password, role],
    );

    if (role == "student") {
      res.redirect(`/dashboard?name=${name}`);
    } else if (role == "teacher") {
      res.redirect(`/teacher_dashboard?name=${name}`);
    }

    // Redirect to dashboard
  } catch (err) {
    console.log(err);

    res.send("Error during signup");
  }
});

app.get("/dashboard", (req, res) => {
  const username = req.query.name || "Student";

  res.render("dashboard.ejs", {
    username: username,
  });
});

app.get("/teacher_dashboard", (req, res) => {
  const username = req.query.name || "Teacher";

  res.render("teacher_dashboard.ejs", {
    username: username,
  });
});

app.get("/addmarks", async (req, res) => {
  try {
    const students = await db.query(
      "SELECT * FROM users WHERE role = 'student'",
    );

    res.render("addmarks.ejs", {
      students: students.rows,
    });
  } catch (err) {
    console.log(err);

    res.send("Error");
  }
});

app.post("/addmarks", async (req, res) => {
  const student_id = req.body.student_id;

  const subject = req.body.subject;

  const marks = req.body.marks;

  try {
    await db.query(
      "INSERT INTO results(student_id, subject, marks) VALUES($1, $2, $3)",
      [student_id, subject, marks],
    );

    res.send("Marks Added Successfully");
  } catch (err) {
    console.log(err);

    res.send("Error adding marks");
  }
});

app.get("/results", async (req, res) => {
  try {
    const result = await db.query(`
            SELECT users.name,
                   results.subject,
                   results.marks
            FROM results
            JOIN users
            ON results.student_id = users.id
        `);

    res.render("results.ejs", {
      results: result.rows,
    });
  } catch (err) {
    console.log(err);

    res.send("Error fetching results");
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.post("/upload", upload.single("material"), async (req, res) => {

  const title = req.body.title;
  const filename = req.file.filename;

  await db.query(
    "INSERT INTO materials (title, filename, uploadedby) VALUES ($1,$2,$3)",
    [title, filename, "Teacher"]
  );

  
    res.send(" Added Notes Successfully");
});

app.get("/materials", async (req, res) => {

  const result = await db.query("SELECT * FROM materials");

  res.render("materials.ejs", {
    materials: result.rows
  });

});

app.get("/upload", (req, res) => {
    res.render("upload.ejs");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
