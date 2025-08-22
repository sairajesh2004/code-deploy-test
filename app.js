const express = require('express')
const app = express()
app.use(express.json())

const path = require('path')
const dbpath = path.join(__dirname, 'userData.db')

const {open} = require('sqlite')
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

    intializeserver().then(() => {
      app.listen(PORT, () => {
        console.log('Server running at http://localhost:3000')
      })
    })
  } catch (e) {
    console.log(`DB message: ${e.message}`)
    process.exit(1)
  }
}

app.post(`/register`, async (request, response) => {
  const {username, name, password, gender, location} = request.body
  if (request.body.password.length < 5) {
    response.status(400)
    response.send('Password is too short')
  } else {
    const hashedpwd = await bcrypt.hash(request.body.password, 10)
    const thequery = `select * from user where username = '${username}';`
    const theanswer = await dbase.get(thequery)
    if (theanswer === undefined) {
      const createquery = `insert into user(username,name,password,gender,location) values('${username}','${name}','${hashedpwd}','${gender}','${location}');`
      const afterregis = await dbase.run(createquery)
      const regisid = afterregis.lastId
      response.status(200)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('User already exists')
    }
  }
})

app.post(`/login`, async (request, response) => {
  const {username, password} = request.body
  const thequery = `select * from user where username = '${username}';`
  const theanswer = await dbase.get(thequery)
  if (theanswer === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const yesorno = await bcrypt.compare(password, theanswer.password)
    if (yesorno) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put(`/change-password`, async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const thequery = `select * from user where username = '${username}';`
  const theanswer = await dbase.get(thequery)
  if (theanswer !== undefined) {
    const yesorno = await bcrypt.compare(oldPassword, theanswer.password)
    if (yesorno) {
      if (request.body.newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const newhashedpwd = await bcrypt.hash(newPassword, 10)
        const updtquery = `update user set password = '${newhashedpwd}' where username= '${username}';`
        await dbase.run(updtquery)
        response.status(200)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
