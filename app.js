const express = require('express')
const app = express()
app.use(express.json())

const path = require('path')
const dbpath = path.join(__dirname, 'userData.db')

const { open } = require('sqlite')
const sqlite3 = require('sqlite3')

const bcrypt = require('bcrypt')

let dbase = null

const intializeserver = async () => {
  try {
    dbase = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })

    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`)
    })
  } catch (e) {
    console.log(`DB message: ${e.message}`)
    process.exit(1)
  }
}

intializeserver()

// ---------------- API ROUTES ---------------- //

app.post(`/register`, async (request, response) => {
  const { username, name, password, gender, location } = request.body
  if (password.length < 5) {
    response.status(400).send('Password is too short')
  } else {
    const hashedpwd = await bcrypt.hash(password, 10)
    const thequery = `SELECT * FROM user WHERE username = '${username}';`
    const theanswer = await dbase.get(thequery)
    if (theanswer === undefined) {
      const createquery = `
        INSERT INTO user(username,name,password,gender,location) 
        VALUES('${username}','${name}','${hashedpwd}','${gender}','${location}');
      `
      await dbase.run(createquery)
      response.status(200).send('User created successfully')
    } else {
      response.status(400).send('User already exists')
    }
  }
})

app.post(`/login`, async (request, response) => {
  const { username, password } = request.body
  const thequery = `SELECT * FROM user WHERE username = '${username}';`
  const theanswer = await dbase.get(thequery)
  if (theanswer === undefined) {
    response.status(400).send('Invalid user')
  } else {
    const yesorno = await bcrypt.compare(password, theanswer.password)
    if (yesorno) {
      response.status(200).send('Login success!')
    } else {
      response.status(400).send('Invalid password')
    }
  }
})

app.put(`/change-password`, async (request, response) => {
  const { username, oldPassword, newPassword } = request.body
  const thequery = `SELECT * FROM user WHERE username = '${username}';`
  const theanswer = await dbase.get(thequery)
  if (theanswer !== undefined) {
    const yesorno = await bcrypt.compare(oldPassword, theanswer.password)
    if (yesorno) {
      if (newPassword.length < 5) {
        response.status(400).send('Password is too short')
      } else {
        const newhashedpwd = await bcrypt.hash(newPassword, 10)
        const updtquery = `UPDATE user SET password = '${newhashedpwd}' WHERE username= '${username}';`
        await dbase.run(updtquery)
        response.status(200).send('Password updated')
      }
    } else {
      response.status(400).send('Invalid current password')
    }
  }
})

module.exports = app
