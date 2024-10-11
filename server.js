const express = require('express')
const app = express()
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
app.use(express.static('public')) //serve our files in public statically


// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Database connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',   // Replace with your MySQL username
    password: 'root',  // Replace with your MySQL password
    database: 'minor_pproject' , // The database we created earlier
    port :'3307'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});

// Route to save activity status
app.post('/save-activity', (req, res) => {
    const { roll_number, activity_status } = req.body;

    const query = `INSERT INTO student_activity (roll_number, activity_status) VALUES (?, ?)`;

    connection.query(query, [roll_number, activity_status], (error, results) => {
        if (error) {
            console.error('Error saving activity:', error);
            res.status(500).send({ error: 'Database error' });
        } else {
            res.status(200).send({ success: true, message: 'Activity saved successfully!' });
        }
    });
});

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(5010)