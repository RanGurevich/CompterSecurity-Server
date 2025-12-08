const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10; // salt work cost


const createUserHash = async(userPassword) => {
    //const userPassword = "MySecretPass123";
    // create the user hash
    const userHash = await bcrypt.hash(userPassword, SALT_ROUNDS);
    console.log('hash is: '+userHash)
    return userHash
}

const checkIfThePasswordIsCorrect = async(userPasswordAttemp, userHash) => {
    // returning true or false if both password have the same hash
    return await bcrypt.compare(userPasswordAttemp, userHash)
}

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


module.exports = {
    createUserHash,
    checkIfThePasswordIsCorrect,
    checkSaltHashEncrypt
}