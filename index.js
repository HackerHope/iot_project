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

//JSON interpreter

app.use(express.json())

//APIs 

app.get('/about', (req, res) => {
    res.send("This is our about page")
})

app.get('/users', (req, res) => {
    res.send(users)
})

app.get('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);

    const user = users.find((u) => u.id === userId);
    res.send(user)
})

app.post('/users', (req, res) => {
    const user = req.body;

    if (!user.name){
        return res.status(400).json({message: " Name is required"})
    }
    if (!user.age){
        return res.status(400).json({message: " Age is required"})
    }
    if (!user.sex){
        return res.status(400).json({message: " Sex is required"})
    }

    const newUser = {
        id : users[users.length-1].id + 1,
        name : user.name,
        age : user.age, 
        sex : user.sex
    };

    users.push(newUser);
    console.log(newUser);
    res.send(newUser)
})

app.put('/users/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const {name, age, sex} = req.body;
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1){
        return res.status(404).json({message: "User not found"});
    }
    if (name){
        users[userIndex].name = name;
    }
    if (age){
        users[userIndex].age = age;
    }
    if (sex){
        users[userIndex].sex = sex;
    }

    res.json(users[userIndex])
})

app.delete('/users/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1){
        return res.status(404).json({message: "User not found"});
    }
    users.splice(userIndex, 1);

    res.json({message: "User deleted successfully"})
})

app.listen(5000, () => {
    console.log("Server is listening on port 5000...")
})
