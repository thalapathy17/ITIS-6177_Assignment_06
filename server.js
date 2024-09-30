const express = require('express');
const mariadb = require('mariadb');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();

app.use(express.json()); // Middleware to parse JSON requests

// Create MariaDB connection pool
const pool = mariadb.createPool({
  host: 'localhost', // Change to your MariaDB host
  user: 'root',      // Change to your MariaDB user
  password: 'root',  // Change to your MariaDB password
  database: 'sample',  // Change to your database name
  port: 3306,
  connectionLimit: 5
});

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Student API',
      version: '1.0.0',
      description: 'API for managing students'
    },
    servers: [
      {
        url: 'http://157.230.186.31:3000' // Replace with your DigitalOcean IP address
      }
    ]
  },
  apis: ['./server.js'], // Path to the API docs
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Utility function to query the database
const queryDB = async (query, params) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(query, params);
    return result;
  } catch (err) {
    throw err;
  } finally {
    if (conn) conn.end();
  }
};

// 1. GET all students
/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get all students
 *     responses:
 *       200:
 *         description: Successfully fetched all students
 *       500:
 *         description: Error fetching students
 */
app.get('/students', async (req, res) => {
  try {
    const students = await queryDB('SELECT * FROM student', []);
    console.log('Fetched students:', students);  // Debugging
    res.json(students);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Error fetching students', details:err.message });
  }
});

// 2. GET student by CLASS, SECTION, and ROLLID
/**
 * @swagger
 * /students/{class}/{section}/{rollid}:
 *   get:
 *     summary: Get a student by CLASS, SECTION, and ROLLID
 *     parameters:
 *       - in: path
 *         name: class
 *         required: true
 *         description: Class of the student
 *         schema:
 *           type: string
 *       - in: path
 *         name: section
 *         required: true
 *         description: Section of the student
 *         schema:
 *           type: string
 *       - in: path
 *         name: rollid
 *         required: true
 *         description: Roll ID of the student
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully fetched the student
 *       404:
 *         description: Student not found
 *       500:
 *         description: Error fetching student
 */
app.get('/students/:class/:section/:rollid', async (req, res) => {
  const { class: studentClass, section, rollid } = req.params;
  try {
    const student = await queryDB(
      'SELECT * FROM student WHERE CLASS = ? AND SECTION = ? AND ROLLID = ?',
      [studentClass, section, rollid]
    );
    if (student.length) {
      res.json(student[0]);
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error fetching student' });
  }
});

// 3. GET student by NAME (New API)
/**
 * @swagger
 * /students/name/{name}:
 *   get:
 *     summary: Get students by NAME
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Name of the student
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully fetched students
 *       404:
 *         description: Student not found
 *       500:
 *         description: Error fetching students
 */
app.get('/students/name/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const students = await queryDB(
      'SELECT * FROM student WHERE NAME = ?',
      [name]
    );
    if (students.length) {
      res.json(students);
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error fetching student' });
  }
});

// 4. POST a new student
/**
 * @swagger
 * /students:
 *   post:
 *     summary: Add a new student
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               NAME:
 *                 type: string
 *               TITLE:
 *                 type: string
 *               CLASS:
 *                 type: string
 *               SECTION:
 *                 type: string
 *               ROLLID:
 *                 type: string
 *     responses:
 *       201:
 *         description: Student created successfully
 *       500:
 *         description: Error adding student
 */
app.post('/students', async (req, res) => {
  const { NAME, TITLE, CLASS, SECTION, ROLLID } = req.body;
  try {
    const result = await queryDB(
      'INSERT INTO student (NAME, TITLE, CLASS, SECTION, ROLLID) VALUES (?, ?, ?, ?, ?)',
      [NAME, TITLE, CLASS, SECTION, ROLLID]
    );
    res.status(201).json({ message: 'Student created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Error adding student' });
  }
});

// 5. PATCH student title by CLASS, SECTION, and ROLLID (Update a single field)
/**
 * @swagger
 * /students/{class}/{section}/{rollid}:
 *   patch:
 *     summary: Update a student's title
 *     parameters:
 *       - in: path
 *         name: class
 *         required: true
 *         description: Class of the student
 *         schema:
 *           type: string
 *       - in: path
 *         name: section
 *         required: true
 *         description: Section of the student
 *         schema:
 *           type: string
 *       - in: path
 *         name: rollid
 *         required: true
 *         description: Roll ID of the student
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               TITLE:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student title updated successfully
 *       404:
 *         description: Student not found
 *       500:
 *         description: Error updating student title
 */
app.patch('/students/:class/:section/:rollid', async (req, res) => {
  const { class: studentClass, section, rollid } = req.params;
  const { TITLE } = req.body;
  try {
    const result = await queryDB(
      'UPDATE student SET TITLE = ? WHERE CLASS = ? AND SECTION = ? AND ROLLID = ?',
      [TITLE, studentClass, section, rollid]
    );
    if (result.affectedRows) {
      res.json({ message: 'Student title updated' });
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error updating student title' });
  }
});

// 6. PUT (Full Update) a student by CLASS, SECTION, and ROLLID
/**
 * @swagger
 * /students/{class}/{section}/{rollid}:
 *   put:
 *     summary: Update a student's information
 *     parameters:
 *       - in: path
 *         name: class
 *         required: true
 *         description: Class of the student
 *         schema:
 *           type: string
 *       - in: path
 *         name: section
 *         required: true
 *         description: Section of the student
 *         schema:
 *           type: string
 *       - in: path
 *         name: rollid
 *         required: true
 *         description: Roll ID of the student
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               NAME:
 *                 type: string
 *               TITLE:
 *                 type: string
 *               CLASS:
 *                 type: string
 *               SECTION:
 *                 type: string
 *               ROLLID:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student record updated successfully
 *       404:
 *         description: Student not found
 *        500:
 *         description: Error updating student record
 */
app.put('/students/:class/:section/:rollid', async (req, res) => {
  const { class: studentClass, section, rollid } = req.params;
  const { NAME, TITLE, CLASS, SECTION, ROLLID } = req.body;
  try {
    const result = await queryDB(
      'UPDATE student SET NAME = ?, TITLE = ?, CLASS = ?, SECTION = ?, ROLLID = ? WHERE CLASS = ? AND SECTION = ? AND ROLLID = ?',
      [NAME, TITLE, CLASS, SECTION, ROLLID, studentClass, section, rollid]
    );
    if (result.affectedRows) {
      res.json({ message: 'Student record updated' });
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error updating student record' });
  }
});

// 7. DELETE a student by CLASS, SECTION, and ROLLID
/**
 * @swagger
 * /students/{class}/{section}/{rollid}:
 *   delete:
 *     summary: Delete a student
 *     parameters:
 *       - in: path
 *         name: class
 *         required: true
 *         description: Class of the student
 *         schema:
 *           type: string
 *       - in: path
 *         name: section
 *         required: true
 *         description: Section of the student
 *         schema:
 *           type: string
 *       - in: path
 *         name: rollid
 *         required: true
 *         description: Roll ID of the student
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *       404:
 *         description: Student not found
 *       500:
 *         description: Error deleting student
 */
app.delete('/students/:class/:section/:rollid', async (req, res) => {
  const { class: studentClass, section, rollid } = req.params;
  try {
    const result = await queryDB(
      'DELETE FROM student WHERE CLASS = ? AND SECTION = ? AND ROLLID = ?',
      [studentClass, section, rollid]
    );
    if (result.affectedRows) {
      res.json({ message: 'Student deleted' });
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error deleting student' });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

