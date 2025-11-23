const saltHashEncrypt = require('./Encryptes/bcrypt.js');

const checkSaltHashEncrypt = async () => {
    const userRealPassword = "lk4uhg324lihg23kl@#HJU#@Hkhjb"
    const userFalseAttempPassword = "lkhjfsdbaelihjfba87yu"
    const userHashRealPassword =  await saltHashEncrypt.createUserHash(userRealPassword)

    // now we will attemp to compare the passwords with the real one and false one using the hash compare
    console.log('The User password is: '+ userRealPassword + "\n")
    console.log('Hash check with the real password: '+ userRealPassword)
    console.log('hash compare return: '+ await saltHashEncrypt.checkIfThePasswordIsCorrect(userRealPassword, userHashRealPassword) + "\n")
    console.log('Hash check with the fake password: '+ userFalseAttempPassword)
    console.log('hash compare return: '+ await saltHashEncrypt.checkIfThePasswordIsCorrect(userFalseAttempPassword, userHashRealPassword) + "\n")
}

const main = () => {
    checkSaltHashEncrypt()
}

main()