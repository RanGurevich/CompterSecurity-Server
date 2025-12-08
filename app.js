const saltHashEncrypt = require('./Encryptes/bcrypt.js');
const database = require('./database/database.js');
const express = require('express')

const server = express()

server.get('/', (req, res) => {
  res.send('Hello World')
})

server.get('/test', async(req, res) => {
  res.send(await database.testDB());
})

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
})





// const main = () => {
//     // saltHashEncrypt.checkSaltHashEncrypt()
// }

// main()