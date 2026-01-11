-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: localhost    Database: security-data
-- ------------------------------------------------------
-- Server version	9.0.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `password_history` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `failed_login_attempts` int DEFAULT '0',
  `is_locked` tinyint(1) DEFAULT '0',
  `lock_until` datetime DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'tomernado','tomernado123@gmail.com','$2b$10$l.aGf4zscjMHRE0b4vnHRucniKF9epzSV4q25RDRgAdlchpbF8Gzi',NULL,'2025-12-16 18:19:16',0,0,NULL,NULL,NULL),(2,'tomernado1','tomernado1@gmail.com','$2b$10$6OApzP06BJW2iMmiSfDfveCc/1dTbjmdbJAXC5jFaR.LAqk/OmSOO',NULL,'2025-12-16 18:22:10',3,1,'2026-01-01 14:41:15',NULL,NULL),(3,'tomernado12','tomernado123@gmail.comt','$2b$10$vsnT4L4K./tx/q6vL4skMuCE5l99KJ3FdzupjgNTx104HJklk3R02',NULL,'2025-12-16 18:23:54',3,1,NULL,NULL,NULL),(4,'tomernado1233','tomernado1233@gmail.com','$2b$10$RIe6Ck.FVHIITAH.LwrIWuztfTRv4UlOEqQ41k9A4D8Lk4V0PQIuK','[]','2026-01-01 12:24:48',0,0,NULL,NULL,NULL),(5,'ran','ran7002@gmail.com','$2b$10$.oBAc53IaKmM/cGFr68.g.u31iGAUOheFor6ZTacMR5w8dF2pF3Fy','[\"$2b$10$1qzunMJ4ocKa08zNLqUJE.To4fzNzP3T/Woe0sVeZfvdaQSqh4Nu6\",\"$2b$10$V1QOMgEJZoDApQWw5IAJxOXyxZi2s2iLml4wjeiyerUjZV/TJHnqu\",\"$2b$10$eFliP8lrIQ85XCgk0/FMU.7XrxtmTVvySAcJS32k2rIIXRaGAHu72\"]','2026-01-06 11:10:56',0,0,NULL,'2c56f5b5a13c5a802f5daaf69c567539f084be2d','2026-01-10 00:26:17'),(7,'ran2','rangurevich14@gmail.com','$2b$10$LzN2U88wYCrtxcgcrfPrBee3fT4aNxglURixJ7UQ7a3uCnZFYwwz.',NULL,'2026-01-06 13:14:50',0,0,NULL,'abdb2de290eaa5e69db2ab5fb9498a1d56280d81','2026-01-09 00:53:52'),(8,'alert(\"hi\")','rangurevich15@gmail.com','$2b$10$qiE0UoBUzBffOUMIylCy8eiButUnDVdjiMOT4.7FrvDCOnkL5sQpS',NULL,'2026-01-09 16:24:24',0,0,NULL,NULL,NULL),(9,'<script>alert(\'hi\')</script>','rangurevich16@gmail.com','$2b$10$EEDcXBDwezUfR6uslwyHs.33KxXmy0k9AhoRCSh66.IH6snZa6zCy',NULL,'2026-01-09 16:29:13',0,0,NULL,NULL,NULL),(10,'<svg onload=alert(\'hi\')>','ran700@gmail.com','$2b$10$5UntqJ8QBy/ydU73msJhaun6qDDeD6oeItnQ.qrnfEr7xXmuJUwgS',NULL,'2026-01-09 16:30:20',0,0,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-10 14:55:37
