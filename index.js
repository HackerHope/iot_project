const express = require('express')

const app = express()

const users = [
    {
        id : 1,
        name: "Kevin", 
        age: 21,
        sex: "M"
    },
    {
        id : 2,
        name: "Kasper", 
        age: 24,
        sex: "M"
    },
    {
        id : 3,
        name: "Kimberley", 
        age: 21,
        sex: "F"
    },
];

//APIs 

app.get('/about', (req, res) => {
    res.send("This is our about page")
})

app.get('/todos', (req, res) => {
    res.send(users)
})

app.get('/todos/:id', (req, res) => {
    const userId = parseInt(req.params.id);

    const user = users.find((u) => u.id === userId);
    res.send(user)
})

app.listen(5000, () => {
    console.log("Server is listening on port 5000...")
})
