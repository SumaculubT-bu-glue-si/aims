-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 01, 2025 at 05:12 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `studio_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `assets`
--

CREATE TABLE `assets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `asset_id` varchar(255) NOT NULL,
  `type` varchar(255) DEFAULT NULL,
  `hostname` varchar(255) DEFAULT NULL,
  `manufacturer` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `part_number` varchar(255) DEFAULT NULL,
  `serial_number` varchar(255) DEFAULT NULL,
  `form_factor` varchar(255) DEFAULT NULL,
  `os` varchar(255) DEFAULT NULL,
  `os_bit` varchar(255) DEFAULT NULL,
  `office_suite` varchar(255) DEFAULT NULL,
  `software_license_key` varchar(255) DEFAULT NULL,
  `wired_mac_address` varchar(255) DEFAULT NULL,
  `wired_ip_address` varchar(255) DEFAULT NULL,
  `wireless_mac_address` varchar(255) DEFAULT NULL,
  `wireless_ip_address` varchar(255) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `purchase_price` decimal(15,2) DEFAULT NULL,
  `purchase_price_tax_included` decimal(15,2) DEFAULT NULL,
  `depreciation_years` int(11) DEFAULT NULL,
  `depreciation_dept` varchar(255) DEFAULT NULL,
  `cpu` varchar(255) DEFAULT NULL,
  `memory` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `previous_user` varchar(255) DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `usage_start_date` date DEFAULT NULL,
  `usage_end_date` date DEFAULT NULL,
  `carry_in_out_agreement` varchar(255) DEFAULT NULL,
  `last_updated` timestamp NULL DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `project` varchar(255) DEFAULT NULL,
  `notes1` text DEFAULT NULL,
  `notes2` text DEFAULT NULL,
  `notes3` text DEFAULT NULL,
  `notes4` text DEFAULT NULL,
  `notes5` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `assets`
--

INSERT INTO `assets` (`id`, `asset_id`, `type`, `hostname`, `manufacturer`, `model`, `part_number`, `serial_number`, `form_factor`, `os`, `os_bit`, `office_suite`, `software_license_key`, `wired_mac_address`, `wired_ip_address`, `wireless_mac_address`, `wireless_ip_address`, `purchase_date`, `purchase_price`, `purchase_price_tax_included`, `depreciation_years`, `depreciation_dept`, `cpu`, `memory`, `location`, `status`, `previous_user`, `user_id`, `usage_start_date`, `usage_end_date`, `carry_in_out_agreement`, `last_updated`, `updated_by`, `notes`, `project`, `notes1`, `notes2`, `notes3`, `notes4`, `notes5`, `created_at`, `updated_at`) VALUES
(1, '1', 'pc', 'GSI01', 'Dell', 'XPS 13 9310', 'N/A', 'CN1A01B2C3', 'Laptop', 'Windows 10 Pro', '64-bit', 'Office 365', 'Key-J-001', '00:11:22:33:44:55', '192.168.1.101', 'A1:B2:C3:D4:E5:F6', '10.0.0.1', '2022-12-20', 180000.00, NULL, 4, 'Engineering', 'Intel Core i7-1185G7', '16GB', 'Testing Location', '利用中', '13', 1, '2023-01-15', NULL, 'Signed', '2024-08-28 00:00:00', 'IT Admin', 'Docking station included', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 17:32:39', '2025-09-30 17:40:37'),
(2, '2', 'pc', 'GSI02', 'HP', 'ProDesk 400 G7', 'N/A', 'SNHP002DEF', 'Desktop', 'Windows 10 Pro', '64-bit', 'Office 365', 'Key-T-002', '11:22:33:44:55:66', '192.168.2.202', 'NULL', 'NULL', '2022-11-05', 120000.00, 132000.00, 5, 'Sales', 'Intel Core i5-10500', '8GB', '仙台事務所', '利用中', '13', 2, '2023-02-10', NULL, 'NULL', '2024-08-28 00:00:00', 'IT Admin', 'Standard desktop setup', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 17:32:39', '2025-09-30 17:32:39'),
(3, '3', 'pc', 'GSI03', 'Lenovo', 'ThinkPad T14 Gen 2', 'N/A', 'SNLN003GHI', 'Laptop', 'Windows 11 Pro', '64-bit', 'Office 365', 'Key-I-003', '22:33:44:55:66:77', '192.168.3.303', 'B1:C2:D3:E4:F5:G6', '10.0.0.2', '2023-02-15', 150000.00, 165000.00, 4, 'Marketing', 'Intel Core i5-1135G7', '16GB', '仙台事務所', '故障中', '13', 3, '2023-03-25', NULL, 'Signed', '2024-08-28 00:00:00', 'IT Admin', 'Needs screen repair', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 17:32:39', '2025-09-30 17:32:39'),
(4, '4', 'pc', 'GSI04', 'Apple', 'iMac 24\" M1', 'N/A', 'SNAP004JKL', 'AIO', 'macOS Sonoma', '64-bit', 'Office 365', 'NULL', '33:44:55:66:77:88', '192.168.4.404', 'NULL', 'NULL', '2023-03-10', 200000.00, 220000.00, 4, 'Design', 'Apple M1', '8GB', '仙台事務所', '利用中', '13', 4, '2023-04-01', NULL, 'NULL', '2024-08-28 00:00:00', 'IT Admin', 'Graphic design workstation', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 17:32:39', '2025-09-30 17:32:39'),
(5, '5', 'pc', 'GSI05', 'Dell', 'Latitude 5420', 'N/A', 'SN2A3B4C5D', 'Laptop', 'Windows 10 Pro', '64-bit', 'Office 365', 'Key-C-005', '44:55:66:77:88:99', '192.168.5.505', 'C1:D2:E3:F4:G5:H6', '10.0.0.3', '2023-04-30', 140000.00, 154000.00, 4, 'Sales', 'Intel Core i5-1145G7', '16GB', '仙台事務所', '利用中', '13', 5, '2023-05-18', NULL, 'Signed', '2024-08-28 00:00:00', 'IT Admin', 'For remote sales use', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 17:32:39', '2025-09-30 17:32:39'),
(6, '6', 'pc', 'GSI06', 'Dell', 'OptiPlex 7000', 'N/A', 'SN3B4C5D6E', 'Desktop', 'Windows 11 Pro', '64-bit', 'Office 365', 'Key-L-006', '55:66:77:88:99:00', '192.168.1.106', 'NULL', 'NULL', '2023-06-10', 130000.00, 143000.00, 5, 'IT', 'Intel Core i7-12700', '16GB', '仙台事務所', '保管中', '13', 6, NULL, NULL, 'NULL', '2024-08-28 00:00:00', 'IT Admin', 'Spare unit', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 17:32:39', '2025-09-30 17:32:39'),
(7, '7', 'pc', 'GSI07', 'Lenovo', 'Yoga 7i', 'N/A', 'SN4C5D6E7F', '2-in-1 Laptop', 'Windows 11 Home', '64-bit', 'Office 365', 'Key-A-007', '66:77:88:99:00:11', '192.168.2.207', 'D1:E2:F3:G4:H5:I6', '10.0.0.4', '2023-06-25', 160000.00, 176000.00, 4, 'Marketing', 'Intel Core i5-1235U', '8GB', '仙台事務所', '利用中', '13', 7, '2023-07-05', NULL, 'Signed', '2024-08-28 00:00:00', 'IT Admin', 'Used for presentations', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 17:32:39', '2025-09-30 17:32:39'),
(8, '8', 'pc', 'GSI08', 'Custom', 'Workstation', 'N/A', 'SN5D6E7F8G', 'Desktop', 'Ubuntu 22.04', '64-bit', 'NULL', 'NULL', '77:88:99:00:11:22', '192.168.3.308', 'NULL', 'NULL', '2023-08-10', 300000.00, 330000.00, 5, 'Design', 'AMD Ryzen 9 5950X', '64GB', '仙台事務所', '利用中', '13', 8, '2023-08-20', NULL, 'NULL', '2024-08-28 00:00:00', 'IT Admin', 'High-performance for video editing', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 17:32:39', '2025-09-30 17:32:39'),
(9, '9', 'pc', 'GSI09', 'Apple', 'MacBook Air M2', 'N/A', 'SN6E7F8G9H', 'Laptop', 'macOS Sonoma', '64-bit', 'Office 365', 'NULL', '88:99:00:11:22:33', '192.168.1.109', 'E1:F2:G3:H4:I5:J6', '10.0.0.5', '2023-08-30', 190000.00, 209000.00, 4, 'Engineering', 'Apple M2', '16GB', '仙台事務所', '利用中', '13', 9, '2023-09-10', NULL, 'Signed', '2024-08-28 00:00:00', 'IT Admin', 'NULL', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 17:32:39', '2025-09-30 17:32:39'),
(10, '13', 'pc', 'GSI13', 'Lenovo', 'ThinkPad X1 Carbon Gen 11', 'N/A', 'SN0I1J2K3L', 'Laptop', 'Windows 11 Pro', '64-bit', 'Office 365', 'Key-I-013', '1B:2C:3D:4E:5F:60', '192.168.4.413', 'G1:H2:I3:J4:K5:L6', '10.0.0.7', '2024-02-20', 200000.00, NULL, 4, 'Marketing', 'Intel Core i7-1355U', '16GB', '仙台事務所', '利用中', '12', 13, '2024-03-01', NULL, 'Signed', '2024-08-28 00:00:00', 'IT Admin', 'NULL', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 17:32:39', '2025-09-30 17:40:51'),
(11, '14', 'pc', 'GSI14', 'HP', 'EliteDesk 800 G9', 'N/A', 'SN1J2K3L4M', 'Desktop', 'Windows 11 Pro', '64-bit', 'Office 365', 'Key-J-014', '2C:3D:4E:5F:60:71', '192.168.5.514', 'NULL', 'NULL', '2023-11-25', 110000.00, 121000.00, 5, 'Sales', 'Intel Core i5-13500', '16GB', '仙台事務所', '保管中', '12', 14, NULL, NULL, 'NULL', '2024-08-28 00:00:00', 'IT Admin', 'Spare unit for sales team', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 17:32:39', '2025-09-30 17:32:39'),
(12, '15', 'pc', 'GSI15', 'Dell', 'XPS 13 9310', 'N/A', 'SN2K3L4M5N', 'Laptop', 'Windows 10 Pro', '64-bit', 'Office 365', 'Key-Z-015', '3D:4E:5F:60:71:82', '192.168.1.115', 'H1:I2:J3:K4:L5:M6', '10.0.0.8', '2024-03-30', 170000.00, 187000.00, 4, 'Engineering', 'Intel Core i7-1185G7', '16GB', '仙台事務所', '利用中', '12', 15, '2024-04-10', NULL, 'Signed', '2024-08-28 00:00:00', 'IT Admin', 'NULL', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 17:32:39', '2025-09-30 17:32:39'),
(13, '20', 'pc', 'GSI20', 'Lenovo', 'ThinkCentre M70q', 'N/A', 'SN7P8Q9R0S', 'Mini PC', 'Windows 11 Pro', '64-bit', 'Office 365', 'Key-S-020', '4D:5E:6F:7A:8B:9C', '192.168.1.120', 'NULL', 'NULL', '2024-05-15', 90000.00, NULL, 5, 'IT', 'Intel Core i5-12400T', '8GB', 'Testing Location', '利用中', '12', 20, '2024-05-20', NULL, 'NULL', '2024-08-28 00:00:00', 'IT Admin', 'NULL', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 17:32:39', '2025-09-30 17:43:17'),
(14, '16', 'monitor', 'GSI16', 'Dell', 'U2723QE', 'N/A', 'SN3L4M5N6O', 'NULL', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2023-12-20', 50000.00, 55000.00, 5, 'Engineering', NULL, NULL, '仙台事務所', '利用中', '12', 16, NULL, NULL, 'NULL', '2024-08-28 00:00:00', 'IT Admin', '27-inch 4K Monitor', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 17:32:39', '2025-09-30 17:32:39'),
(15, '17', 'monitor', 'GSI17', 'BenQ', 'PD3220U', 'N/A', 'SN4M5N6O7P', 'NULL', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2023-06-25', 80000.00, 88000.00, 5, 'Marketing', NULL, NULL, '仙台事務所', '利用中', '12', 17, NULL, NULL, 'NULL', '2024-08-28 00:00:00', 'IT Admin', '32-inch 4K Monitor', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 17:32:39', '2025-09-30 17:32:39'),
(16, '10', 'printer', 'GSI10', 'Custom', 'DevBox 2023', 'N/A', 'SN7F8G9H0I', 'Desktop', 'Windows 10 Pro', '64-bit', NULL, 'Key-N-010', '99:00:11:22:33:44', '192.168.2.210', 'NULL', 'NULL', '2018-05-15', 80000.00, 88000.00, 5, 'IT', 'Intel Core i7-7700', '32GB', '仙台事務所', '廃止', NULL, 10, '2023-10-01', '2024-08-20', 'NULL', '2024-08-28 00:00:00', 'IT Admin', 'Decommissioned due to age', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 17:32:40', '2025-09-30 17:32:40'),
(17, '11', 'printer', 'GSI11', 'Dell', 'XPS 15 9530', 'N/A', 'SN8G9H0I1J', 'Laptop', 'Windows 11 Pro', '64-bit', NULL, 'Key-O-011', '01:23:45:67:89:AB', '192.168.1.111', 'F1:G2:H3:I4:J5:K6', '10.0.0.6', '2023-12-20', 250000.00, 275000.00, 4, 'Engineering', 'Intel Core i9-13900H', '32GB', '仙台事務所', '利用中', '12', 11, '2024-01-01', NULL, 'Signed', '2024-08-28 00:00:00', 'IT Admin', 'High-performance laptop for development', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 17:32:40', '2025-09-30 17:32:40'),
(18, '12', 'printer', 'GSI12', 'HP', 'Z2 Tower G9', 'N/A', 'SN9H0I1J2K', 'Desktop', 'Windows 11 Pro', '64-bit', NULL, 'Key-L-012', '0A:1B:2C:3D:4E:5F', '192.168.3.312', 'NULL', 'NULL', '2024-01-10', 350000.00, 385000.00, 5, 'Design', 'Intel Core i7-13700K', '64GB', '仙台事務所', '利用中', '12', 12, '2024-02-15', NULL, 'NULL', '2024-08-28 00:00:00', 'IT Admin', 'For 3D modeling', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 17:32:40', '2025-09-30 17:32:40'),
(19, '18', 'other', 'GSI18', 'iPhone', 'iPhone 15 Pro', 'N/A', 'SN5N6O7P8Q', 'NULL', 'iOS', 'NULL', NULL, 'NULL', 'NULL', 'NULL', 'C3:D4:E5:F6:G7:H8', '10.1.1.101', '2024-03-01', 150000.00, NULL, 3, 'Marketing', 'NULL', 'NULL', 'Testing Location', '利用中', '12', 18, '2024-03-01', NULL, 'Signed', '2024-08-28 00:00:00', 'IT Admin', 'NULL', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 17:32:40', '2025-09-30 17:43:45'),
(20, '19', 'smartphone', 'GSI19', 'Google', 'Pixel 8', 'N/A', 'SN6O7P8Q9R', 'NULL', 'Android', 'NULL', NULL, 'NULL', 'NULL', 'NULL', 'D3:E4:F5:G6:H7:I8', '10.1.1.102', '2023-04-01', 100000.00, 110000.00, 3, 'Design', 'NULL', 'NULL', '仙台事務所', '利用中', '12', 19, '2023-04-01', NULL, 'Signed', '2024-08-28 00:00:00', 'IT Admin', 'NULL', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-30 17:32:40', '2025-09-30 17:32:40');

-- --------------------------------------------------------

--
-- Table structure for table `audit_assets`
--

CREATE TABLE `audit_assets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `audit_plan_id` bigint(20) UNSIGNED NOT NULL,
  `asset_id` bigint(20) UNSIGNED NOT NULL,
  `original_location` varchar(255) NOT NULL,
  `original_user` varchar(255) DEFAULT NULL,
  `current_status` varchar(255) NOT NULL,
  `auditor_notes` text DEFAULT NULL,
  `audited_at` timestamp NULL DEFAULT NULL,
  `resolved` tinyint(1) NOT NULL DEFAULT 0,
  `audit_status` tinyint(1) NOT NULL DEFAULT 0,
  `audited_by` varchar(255) DEFAULT NULL,
  `current_location` varchar(255) DEFAULT NULL,
  `current_user` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_assignments`
--

CREATE TABLE `audit_assignments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `audit_plan_id` bigint(20) UNSIGNED NOT NULL,
  `location_id` bigint(20) UNSIGNED NOT NULL,
  `auditor_id` bigint(20) UNSIGNED NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('Assigned','In Progress','Completed') NOT NULL DEFAULT 'Assigned',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `audit_plan_id` bigint(20) UNSIGNED DEFAULT NULL,
  `asset_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `performed_by` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_plans`
--

CREATE TABLE `audit_plans` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `chat_space_id` varchar(255) DEFAULT NULL,
  `chat_space_name` varchar(255) DEFAULT NULL,
  `chat_space_created_at` timestamp NULL DEFAULT NULL,
  `chat_space_cleanup_scheduled` tinyint(1) NOT NULL DEFAULT 0,
  `name` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `due_date` date NOT NULL,
  `status` enum('Planning','In Progress','Completed','Overdue') NOT NULL DEFAULT 'Planning',
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `corrective_actions`
--

CREATE TABLE `corrective_actions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `audit_asset_id` bigint(20) UNSIGNED NOT NULL,
  `audit_plan_id` bigint(20) UNSIGNED NOT NULL,
  `issue` text NOT NULL,
  `action` text NOT NULL,
  `assigned_to` varchar(255) DEFAULT NULL,
  `priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `status` enum('pending','in_progress','completed','overdue') NOT NULL DEFAULT 'pending',
  `due_date` date NOT NULL,
  `completed_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `corrective_action_assignments`
--

CREATE TABLE `corrective_action_assignments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `corrective_action_id` bigint(20) UNSIGNED NOT NULL,
  `audit_assignment_id` bigint(20) UNSIGNED NOT NULL,
  `assigned_to_employee_id` bigint(20) UNSIGNED DEFAULT NULL,
  `status` enum('pending','in_progress','completed','overdue') NOT NULL DEFAULT 'pending',
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `progress_notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `projects` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`projects`)),
  `email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `employee_id`, `name`, `location`, `projects`, `email`, `created_at`, `updated_at`) VALUES
(1, '108767718456817045968', 'JAMES ALCANTARA', 'Testing Location', '[]', 'alcantara_j@bu.glue-si.com', '2025-09-09 22:35:22', '2025-09-30 17:34:18'),
(2, '100973512639045102145', 'RIENGER ROI N. BASUIL', '仙台事務所', '[]', 'basuil_r@bu.glue-si.com', '2025-09-09 22:35:26', '2025-09-30 17:34:34'),
(3, '111453026733616387309', 'B. CAMAY JOHN MEYNARD', '仙台事務所', '[]', 'camay_j@bu.glue-si.com', '2025-09-09 22:35:26', '2025-09-30 17:36:03'),
(4, '106656809817139377999', 'CARIDAD JEFREY', '仙台事務所', '[]', 'caridad_j@bu.glue-si.com', '2025-09-09 22:35:26', '2025-09-30 17:34:58'),
(5, '116467261787871135552', 'KENNETH VIER J. CERRADO', '仙台事務所', '[]', 'cerrado_k@bu.glue-si.com', '2025-09-09 22:35:26', '2025-09-30 17:36:48'),
(6, '115718461044067200780', 'FERDINAND CORONEL', '仙台事務所', '[]', 'coronel_f@bu.glue-si.com', '2025-09-09 22:35:26', '2025-09-30 17:36:39'),
(7, '115170507799148346938', 'DELA CRUZ JOHN PATRICK', '仙台事務所', '[]', 'cruz_j@bu.glue-si.com', '2025-09-09 22:35:26', '2025-09-30 17:36:33'),
(8, '116913057739588010061', 'DIZON GABRIEL W.', '仙台事務所', '[]', 'dizon_g@bu.glue-si.com', '2025-09-09 22:35:26', '2025-09-30 17:36:52'),
(9, '113837033407651583253', 'GREMYCO ESTOISTA', '仙台事務所', '[]', 'estoista_g@bu.glue-si.com', '2025-09-09 22:35:26', '2025-09-30 17:36:16'),
(10, '109551105376570510603', '考史 橋本', '仙台事務所', '[]', 'hashimoto_t@bu.glue-si.com', '2025-09-09 22:35:26', '2025-09-30 17:35:43'),
(11, '116197156011460190151', 'KATE INOCENTES', '仙台事務所', '[]', 'inocentes_k@bu.glue-si.com', '2025-09-09 22:35:26', '2025-09-30 17:36:43'),
(12, '111167827682287460377', '直樹 泉', '仙台事務所', '[]', 'izumi_n@bu.glue-si.com', '2025-09-09 22:35:26', '2025-09-30 17:35:48'),
(13, '112576027302090851948', '管理者 BeUnique', 'Admin Office', '[]', 'management.gsi@bu.glue-si.com', '2025-09-09 22:35:26', '2025-09-09 22:35:26'),
(14, '113004578899852347515', 'MARK LESTER T. MARIVELES', '仙台事務所', '[]', 'mariveles_m@bu.glue-si.com', '2025-09-09 22:35:26', '2025-09-30 17:36:10'),
(15, '107303350840772580528', 'Meneses Rocelle P.', '仙台事務所', '[]', 'meneses_r@bu.glue-si.com', '2025-09-09 22:35:26', '2025-09-30 17:35:04'),
(16, '102867621555199723580', 'IAN FREDERICK Y. MOSQUERA', '仙台事務所', '[]', 'mosquera_i@bu.glue-si.com', '2025-09-09 22:35:26', '2025-09-30 17:34:39'),
(17, '104600855501570041426', 'rose ninoy', '仙台事務所', '[]', 'ninoy_r@bu.glue-si.com', '2025-09-09 22:35:26', '2025-09-30 17:34:48'),
(18, '108007131275735991722', 'TED OWEN B. REYES', '仙台事務所', '[]', 'reyes_t@bu.glue-si.com', '2025-09-09 22:35:26', '2025-09-30 17:35:08'),
(19, '100640535097714270610', 'MAKKIE SANCHEZ', '仙台事務所', '[]', 'sanchez_m@bu.glue-si.com', '2025-09-09 22:35:26', '2025-09-30 17:34:25'),
(20, '105929970924995611452', 'TYR S. SUMACULUB', 'Testing Location', '[]', 'sumaculub_t@bu.glue-si.com', '2025-09-09 22:35:26', '2025-09-30 17:34:13'),
(25, '100129436352820338196', 'Testing User', 'Testing Location', '[]', 'test@bu.glue-si.com', '2025-09-14 19:01:35', '2025-09-30 17:38:38');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `failed_jobs`
--

INSERT INTO `failed_jobs` (`id`, `uuid`, `connection`, `queue`, `payload`, `exception`, `failed_at`) VALUES
(1, '6827db15-39aa-4f1d-9fc7-25b502b67d21', 'database', 'default', '{\"uuid\":\"6827db15-39aa-4f1d-9fc7-25b502b67d21\",\"displayName\":\"Bu\\\\Gws\\\\Jobs\\\\UpdateGoogleWorkspaceUser\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Bu\\\\Gws\\\\Jobs\\\\UpdateGoogleWorkspaceUser\",\"command\":\"O:37:\\\"Bu\\\\Gws\\\\Jobs\\\\UpdateGoogleWorkspaceUser\\\":2:{s:10:\\\"\\u0000*\\u0000userKey\\\";s:21:\\\"100129436352820338196\\\";s:11:\\\"\\u0000*\\u0000userData\\\";a:1:{s:4:\\\"name\\\";a:2:{s:9:\\\"givenName\\\";s:7:\\\"TESTING\\\";s:10:\\\"familyName\\\";s:1:\\\"-\\\";}}}\"},\"createdAt\":1758852795,\"delay\":null}', 'Exception: Failed to update user in Google Workspace in C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\bu\\gws\\src\\Services\\GoogleWorkspaceService.php:409\nStack trace:\n#0 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\bu\\gws\\src\\Jobs\\UpdateGoogleWorkspaceUser.php(27): Bu\\Gws\\Services\\GoogleWorkspaceService->updateUser(\'100129436352820...\', Array)\n#1 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(36): Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser->handle(Object(Bu\\Gws\\Services\\GoogleWorkspaceService))\n#2 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#3 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#4 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#5 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Container.php(836): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#6 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Bus\\Dispatcher.php(132): Illuminate\\Container\\Container->call(Array)\n#7 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(180): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser))\n#8 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser))\n#9 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Bus\\Dispatcher.php(136): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#10 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(134): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser), false)\n#11 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(180): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser))\n#12 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser))\n#13 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(127): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#14 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(68): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Object(Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser))\n#15 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Jobs\\Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Array)\n#16 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(451): Illuminate\\Queue\\Jobs\\Job->fire()\n#17 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(401): Illuminate\\Queue\\Worker->process(\'database\', Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Object(Illuminate\\Queue\\WorkerOptions))\n#18 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(187): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), \'database\', Object(Illuminate\\Queue\\WorkerOptions))\n#19 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Console\\WorkCommand.php(148): Illuminate\\Queue\\Worker->daemon(\'database\', \'default\', Object(Illuminate\\Queue\\WorkerOptions))\n#20 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Console\\WorkCommand.php(131): Illuminate\\Queue\\Console\\WorkCommand->runWorker(\'database\', \'default\')\n#21 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#22 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#23 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#24 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#25 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Container.php(836): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#26 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Console\\Command.php(211): Illuminate\\Container\\Container->call(Array)\n#27 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\symfony\\console\\Command\\Command.php(318): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#28 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Console\\Command.php(180): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#29 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\symfony\\console\\Application.php(1110): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#30 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\symfony\\console\\Application.php(359): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#31 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\symfony\\console\\Application.php(194): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#32 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Foundation\\Console\\Kernel.php(197): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#33 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\vendor\\laravel\\framework\\src\\Illuminate\\Foundation\\Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#34 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\server-latest\\artisan(16): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#35 {main}', '2025-09-25 18:13:31'),
(2, '37ac699e-acdb-48e5-8076-50cf9694a38d', 'database', 'default', '{\"uuid\":\"37ac699e-acdb-48e5-8076-50cf9694a38d\",\"displayName\":\"Bu\\\\Gws\\\\Jobs\\\\CreateAuditNotifications\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Bu\\\\Gws\\\\Jobs\\\\CreateAuditNotifications\",\"command\":\"O:36:\\\"Bu\\\\Gws\\\\Jobs\\\\CreateAuditNotifications\\\":2:{s:12:\\\"\\u0000*\\u0000auditPlan\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:26:\\\"Bu\\\\Server\\\\Models\\\\AuditPlan\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:11:\\\"\\u0000*\\u0000location\\\";s:15:\\\"仙台事務所\\\";}\"},\"createdAt\":1759214028,\"delay\":null}', 'Illuminate\\Database\\Eloquent\\ModelNotFoundException: No query results for model [Bu\\Server\\Models\\AuditPlan]. in C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Eloquent\\Builder.php:780\nStack trace:\n#0 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\SerializesAndRestoresModelIdentifiers.php(110): Illuminate\\Database\\Eloquent\\Builder->firstOrFail()\n#1 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\SerializesAndRestoresModelIdentifiers.php(63): Bu\\Gws\\Jobs\\CreateAuditNotifications->restoreModel(Object(Illuminate\\Contracts\\Database\\ModelIdentifier))\n#2 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\SerializesModels.php(97): Bu\\Gws\\Jobs\\CreateAuditNotifications->getRestoredPropertyValue(Object(Illuminate\\Contracts\\Database\\ModelIdentifier))\n#3 [internal function]: Bu\\Gws\\Jobs\\CreateAuditNotifications->__unserialize(Array)\n#4 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(95): unserialize(\'O:36:\"Bu\\\\Gws\\\\Jo...\')\n#5 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(62): Illuminate\\Queue\\CallQueuedHandler->getCommand(Array)\n#6 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Jobs\\Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Array)\n#7 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(451): Illuminate\\Queue\\Jobs\\Job->fire()\n#8 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(401): Illuminate\\Queue\\Worker->process(\'database\', Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Object(Illuminate\\Queue\\WorkerOptions))\n#9 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(187): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), \'database\', Object(Illuminate\\Queue\\WorkerOptions))\n#10 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Console\\WorkCommand.php(148): Illuminate\\Queue\\Worker->daemon(\'database\', \'default\', Object(Illuminate\\Queue\\WorkerOptions))\n#11 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Console\\WorkCommand.php(131): Illuminate\\Queue\\Console\\WorkCommand->runWorker(\'database\', \'default\')\n#12 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#13 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#14 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#15 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#16 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Container.php(836): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#17 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Console\\Command.php(211): Illuminate\\Container\\Container->call(Array)\n#18 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Command\\Command.php(318): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#19 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Console\\Command.php(180): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#20 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(1110): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#21 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(359): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#22 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(194): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#23 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Foundation\\Console\\Kernel.php(197): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#24 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Foundation\\Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#25 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\artisan(16): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#26 {main}', '2025-09-30 17:30:32'),
(3, '65081342-8300-486e-b0b0-3baa4febdd32', 'database', 'default', '{\"uuid\":\"65081342-8300-486e-b0b0-3baa4febdd32\",\"displayName\":\"Bu\\\\Gws\\\\Jobs\\\\UpdateGoogleWorkspaceUser\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Bu\\\\Gws\\\\Jobs\\\\UpdateGoogleWorkspaceUser\",\"command\":\"O:37:\\\"Bu\\\\Gws\\\\Jobs\\\\UpdateGoogleWorkspaceUser\\\":2:{s:10:\\\"\\u0000*\\u0000userKey\\\";s:21:\\\"108387363863423351520\\\";s:11:\\\"\\u0000*\\u0000userData\\\";a:1:{s:4:\\\"name\\\";a:2:{s:9:\\\"givenName\\\";s:7:\\\"Testing\\\";s:10:\\\"familyName\\\";s:1:\\\"2\\\";}}}\"},\"createdAt\":1759282644,\"delay\":null}', 'Exception: Failed to update user in Google Workspace in C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\pkg-bu-gws\\src\\Services\\GoogleWorkspaceService.php:382\nStack trace:\n#0 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\pkg-bu-gws\\src\\Jobs\\UpdateGoogleWorkspaceUser.php(27): Bu\\Gws\\Services\\GoogleWorkspaceService->updateUser(\'108387363863423...\', Array)\n#1 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(36): Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser->handle(Object(Bu\\Gws\\Services\\GoogleWorkspaceService))\n#2 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#3 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#4 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#5 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Container.php(836): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#6 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Bus\\Dispatcher.php(132): Illuminate\\Container\\Container->call(Array)\n#7 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(180): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser))\n#8 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser))\n#9 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Bus\\Dispatcher.php(136): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#10 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(134): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser), false)\n#11 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(180): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser))\n#12 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser))\n#13 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(127): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#14 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(68): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Object(Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser))\n#15 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Jobs\\Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Array)\n#16 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(451): Illuminate\\Queue\\Jobs\\Job->fire()\n#17 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(401): Illuminate\\Queue\\Worker->process(\'database\', Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Object(Illuminate\\Queue\\WorkerOptions))\n#18 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(187): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), \'database\', Object(Illuminate\\Queue\\WorkerOptions))\n#19 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Console\\WorkCommand.php(148): Illuminate\\Queue\\Worker->daemon(\'database\', \'default\', Object(Illuminate\\Queue\\WorkerOptions))\n#20 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Console\\WorkCommand.php(131): Illuminate\\Queue\\Console\\WorkCommand->runWorker(\'database\', \'default\')\n#21 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#22 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#23 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#24 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#25 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Container.php(836): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#26 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Console\\Command.php(211): Illuminate\\Container\\Container->call(Array)\n#27 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Command\\Command.php(318): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#28 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Console\\Command.php(180): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#29 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(1110): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#30 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(359): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#31 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(194): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#32 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Foundation\\Console\\Kernel.php(197): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#33 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Foundation\\Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#34 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\artisan(16): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#35 {main}', '2025-09-30 17:37:28'),
(4, '1102e5c2-c3c5-4aae-a51d-444b5a4d868e', 'database', 'default', '{\"uuid\":\"1102e5c2-c3c5-4aae-a51d-444b5a4d868e\",\"displayName\":\"Bu\\\\Gws\\\\Jobs\\\\UpdateGoogleWorkspaceUser\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Bu\\\\Gws\\\\Jobs\\\\UpdateGoogleWorkspaceUser\",\"command\":\"O:37:\\\"Bu\\\\Gws\\\\Jobs\\\\UpdateGoogleWorkspaceUser\\\":2:{s:10:\\\"\\u0000*\\u0000userKey\\\";s:21:\\\"114854955772284634758\\\";s:11:\\\"\\u0000*\\u0000userData\\\";a:1:{s:4:\\\"name\\\";a:2:{s:9:\\\"givenName\\\";s:7:\\\"Testing\\\";s:10:\\\"familyName\\\";s:1:\\\"3\\\";}}}\"},\"createdAt\":1759282672,\"delay\":null}', 'Exception: Failed to update user in Google Workspace in C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\pkg-bu-gws\\src\\Services\\GoogleWorkspaceService.php:382\nStack trace:\n#0 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\pkg-bu-gws\\src\\Jobs\\UpdateGoogleWorkspaceUser.php(27): Bu\\Gws\\Services\\GoogleWorkspaceService->updateUser(\'114854955772284...\', Array)\n#1 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(36): Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser->handle(Object(Bu\\Gws\\Services\\GoogleWorkspaceService))\n#2 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#3 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#4 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#5 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Container.php(836): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#6 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Bus\\Dispatcher.php(132): Illuminate\\Container\\Container->call(Array)\n#7 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(180): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser))\n#8 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser))\n#9 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Bus\\Dispatcher.php(136): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#10 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(134): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser), false)\n#11 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(180): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser))\n#12 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser))\n#13 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(127): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#14 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(68): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Object(Bu\\Gws\\Jobs\\UpdateGoogleWorkspaceUser))\n#15 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Jobs\\Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Array)\n#16 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(451): Illuminate\\Queue\\Jobs\\Job->fire()\n#17 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(401): Illuminate\\Queue\\Worker->process(\'database\', Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Object(Illuminate\\Queue\\WorkerOptions))\n#18 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(187): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), \'database\', Object(Illuminate\\Queue\\WorkerOptions))\n#19 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Console\\WorkCommand.php(148): Illuminate\\Queue\\Worker->daemon(\'database\', \'default\', Object(Illuminate\\Queue\\WorkerOptions))\n#20 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Console\\WorkCommand.php(131): Illuminate\\Queue\\Console\\WorkCommand->runWorker(\'database\', \'default\')\n#21 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#22 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#23 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#24 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#25 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Container.php(836): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#26 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Console\\Command.php(211): Illuminate\\Container\\Container->call(Array)\n#27 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Command\\Command.php(318): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#28 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Console\\Command.php(180): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#29 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(1110): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#30 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(359): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#31 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(194): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#32 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Foundation\\Console\\Kernel.php(197): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#33 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Foundation\\Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#34 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\artisan(16): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#35 {main}', '2025-09-30 17:37:53'),
(5, '5d18ae8d-883b-4ab8-8ce2-077b4ead5ae0', 'database', 'default', '{\"uuid\":\"5d18ae8d-883b-4ab8-8ce2-077b4ead5ae0\",\"displayName\":\"Bu\\\\Gws\\\\Jobs\\\\DeleteGoogleWorkspaceUser\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Bu\\\\Gws\\\\Jobs\\\\DeleteGoogleWorkspaceUser\",\"command\":\"O:37:\\\"Bu\\\\Gws\\\\Jobs\\\\DeleteGoogleWorkspaceUser\\\":1:{s:10:\\\"\\u0000*\\u0000userKey\\\";s:21:\\\"114854955772284634758\\\";}\"},\"createdAt\":1759282687,\"delay\":null}', 'Exception: Failed to delete user from Google Workspace in C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\pkg-bu-gws\\src\\Services\\GoogleWorkspaceService.php:513\nStack trace:\n#0 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\pkg-bu-gws\\src\\Jobs\\DeleteGoogleWorkspaceUser.php(25): Bu\\Gws\\Services\\GoogleWorkspaceService->deleteUser(\'114854955772284...\')\n#1 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(36): Bu\\Gws\\Jobs\\DeleteGoogleWorkspaceUser->handle(Object(Bu\\Gws\\Services\\GoogleWorkspaceService))\n#2 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#3 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#4 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#5 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Container.php(836): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#6 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Bus\\Dispatcher.php(132): Illuminate\\Container\\Container->call(Array)\n#7 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(180): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Bu\\Gws\\Jobs\\DeleteGoogleWorkspaceUser))\n#8 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Bu\\Gws\\Jobs\\DeleteGoogleWorkspaceUser))\n#9 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Bus\\Dispatcher.php(136): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#10 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(134): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Bu\\Gws\\Jobs\\DeleteGoogleWorkspaceUser), false)\n#11 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(180): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Bu\\Gws\\Jobs\\DeleteGoogleWorkspaceUser))\n#12 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Bu\\Gws\\Jobs\\DeleteGoogleWorkspaceUser))\n#13 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(127): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#14 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(68): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Object(Bu\\Gws\\Jobs\\DeleteGoogleWorkspaceUser))\n#15 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Jobs\\Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Array)\n#16 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(451): Illuminate\\Queue\\Jobs\\Job->fire()\n#17 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(401): Illuminate\\Queue\\Worker->process(\'database\', Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Object(Illuminate\\Queue\\WorkerOptions))\n#18 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(187): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), \'database\', Object(Illuminate\\Queue\\WorkerOptions))\n#19 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Console\\WorkCommand.php(148): Illuminate\\Queue\\Worker->daemon(\'database\', \'default\', Object(Illuminate\\Queue\\WorkerOptions))\n#20 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Console\\WorkCommand.php(131): Illuminate\\Queue\\Console\\WorkCommand->runWorker(\'database\', \'default\')\n#21 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#22 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#23 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#24 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#25 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Container.php(836): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#26 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Console\\Command.php(211): Illuminate\\Container\\Container->call(Array)\n#27 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Command\\Command.php(318): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#28 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Console\\Command.php(180): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#29 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(1110): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#30 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(359): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#31 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(194): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#32 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Foundation\\Console\\Kernel.php(197): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#33 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Foundation\\Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#34 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\artisan(16): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#35 {main}', '2025-09-30 17:38:09');
INSERT INTO `failed_jobs` (`id`, `uuid`, `connection`, `queue`, `payload`, `exception`, `failed_at`) VALUES
(6, 'fba79858-8a9a-46ac-aef7-0a1106a749a7', 'database', 'default', '{\"uuid\":\"fba79858-8a9a-46ac-aef7-0a1106a749a7\",\"displayName\":\"Bu\\\\Gws\\\\Jobs\\\\DeleteGoogleWorkspaceUser\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Bu\\\\Gws\\\\Jobs\\\\DeleteGoogleWorkspaceUser\",\"command\":\"O:37:\\\"Bu\\\\Gws\\\\Jobs\\\\DeleteGoogleWorkspaceUser\\\":1:{s:10:\\\"\\u0000*\\u0000userKey\\\";s:21:\\\"108387363863423351520\\\";}\"},\"createdAt\":1759282698,\"delay\":null}', 'Exception: Failed to delete user from Google Workspace in C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\pkg-bu-gws\\src\\Services\\GoogleWorkspaceService.php:513\nStack trace:\n#0 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\pkg-bu-gws\\src\\Jobs\\DeleteGoogleWorkspaceUser.php(25): Bu\\Gws\\Services\\GoogleWorkspaceService->deleteUser(\'108387363863423...\')\n#1 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(36): Bu\\Gws\\Jobs\\DeleteGoogleWorkspaceUser->handle(Object(Bu\\Gws\\Services\\GoogleWorkspaceService))\n#2 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#3 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#4 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#5 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Container.php(836): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#6 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Bus\\Dispatcher.php(132): Illuminate\\Container\\Container->call(Array)\n#7 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(180): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Bu\\Gws\\Jobs\\DeleteGoogleWorkspaceUser))\n#8 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Bu\\Gws\\Jobs\\DeleteGoogleWorkspaceUser))\n#9 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Bus\\Dispatcher.php(136): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#10 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(134): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Bu\\Gws\\Jobs\\DeleteGoogleWorkspaceUser), false)\n#11 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(180): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Bu\\Gws\\Jobs\\DeleteGoogleWorkspaceUser))\n#12 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Bu\\Gws\\Jobs\\DeleteGoogleWorkspaceUser))\n#13 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(127): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#14 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(68): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Object(Bu\\Gws\\Jobs\\DeleteGoogleWorkspaceUser))\n#15 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Jobs\\Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Array)\n#16 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(451): Illuminate\\Queue\\Jobs\\Job->fire()\n#17 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(401): Illuminate\\Queue\\Worker->process(\'database\', Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Object(Illuminate\\Queue\\WorkerOptions))\n#18 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(187): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), \'database\', Object(Illuminate\\Queue\\WorkerOptions))\n#19 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Console\\WorkCommand.php(148): Illuminate\\Queue\\Worker->daemon(\'database\', \'default\', Object(Illuminate\\Queue\\WorkerOptions))\n#20 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Console\\WorkCommand.php(131): Illuminate\\Queue\\Console\\WorkCommand->runWorker(\'database\', \'default\')\n#21 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#22 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#23 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#24 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#25 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Container.php(836): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#26 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Console\\Command.php(211): Illuminate\\Container\\Container->call(Array)\n#27 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Command\\Command.php(318): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#28 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Console\\Command.php(180): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#29 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(1110): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#30 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(359): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#31 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(194): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#32 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Foundation\\Console\\Kernel.php(197): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#33 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Foundation\\Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#34 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\artisan(16): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#35 {main}', '2025-09-30 17:38:22'),
(7, 'f76a822d-0a0a-4b49-aa45-cf62c69c8a19', 'database', 'default', '{\"uuid\":\"f76a822d-0a0a-4b49-aa45-cf62c69c8a19\",\"displayName\":\"Bu\\\\Gws\\\\Jobs\\\\CreateAuditNotifications\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Bu\\\\Gws\\\\Jobs\\\\CreateAuditNotifications\",\"command\":\"O:36:\\\"Bu\\\\Gws\\\\Jobs\\\\CreateAuditNotifications\\\":2:{s:12:\\\"\\u0000*\\u0000auditPlan\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:26:\\\"Bu\\\\Server\\\\Models\\\\AuditPlan\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:11:\\\"\\u0000*\\u0000location\\\";s:16:\\\"Testing Location\\\";}\"},\"createdAt\":1759283100,\"delay\":null}', 'PDOException: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'chat_space_id\' in \'field list\' in C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Connection.php:591\nStack trace:\n#0 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Connection.php(591): PDO->prepare(\'update `audit_p...\')\n#1 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Connection.php(811): Illuminate\\Database\\Connection->Illuminate\\Database\\{closure}(\'update `audit_p...\', Array)\n#2 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Connection.php(778): Illuminate\\Database\\Connection->runQueryCallback(\'update `audit_p...\', Array, Object(Closure))\n#3 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Connection.php(583): Illuminate\\Database\\Connection->run(\'update `audit_p...\', Array, Object(Closure))\n#4 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Connection.php(535): Illuminate\\Database\\Connection->affectingStatement(\'update `audit_p...\', Array)\n#5 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Query\\Builder.php(3917): Illuminate\\Database\\Connection->update(\'update `audit_p...\', Array)\n#6 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Eloquent\\Builder.php(1266): Illuminate\\Database\\Query\\Builder->update(Object(Illuminate\\Support\\Collection))\n#7 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Eloquent\\Model.php(1316): Illuminate\\Database\\Eloquent\\Builder->update(Array)\n#8 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Eloquent\\Model.php(1233): Illuminate\\Database\\Eloquent\\Model->performUpdate(Object(Illuminate\\Database\\Eloquent\\Builder))\n#9 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Eloquent\\Model.php(1090): Illuminate\\Database\\Eloquent\\Model->save(Array)\n#10 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\pkg-bu-gws\\src\\Jobs\\CreateAuditNotifications.php(66): Illuminate\\Database\\Eloquent\\Model->update(Array)\n#11 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(36): Bu\\Gws\\Jobs\\CreateAuditNotifications->handle(Object(Bu\\Gws\\Services\\GoogleWorkspaceService))\n#12 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Container.php(836): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Bus\\Dispatcher.php(132): Illuminate\\Container\\Container->call(Array)\n#17 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(180): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Bu\\Gws\\Jobs\\CreateAuditNotifications))\n#18 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Bu\\Gws\\Jobs\\CreateAuditNotifications))\n#19 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Bus\\Dispatcher.php(136): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(134): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Bu\\Gws\\Jobs\\CreateAuditNotifications), false)\n#21 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(180): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Bu\\Gws\\Jobs\\CreateAuditNotifications))\n#22 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Bu\\Gws\\Jobs\\CreateAuditNotifications))\n#23 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(127): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(68): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Object(Bu\\Gws\\Jobs\\CreateAuditNotifications))\n#25 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Jobs\\Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Array)\n#26 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(451): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(401): Illuminate\\Queue\\Worker->process(\'database\', Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(187): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), \'database\', Object(Illuminate\\Queue\\WorkerOptions))\n#29 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Console\\WorkCommand.php(148): Illuminate\\Queue\\Worker->daemon(\'database\', \'default\', Object(Illuminate\\Queue\\WorkerOptions))\n#30 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Console\\WorkCommand.php(131): Illuminate\\Queue\\Console\\WorkCommand->runWorker(\'database\', \'default\')\n#31 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Container.php(836): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Console\\Command.php(211): Illuminate\\Container\\Container->call(Array)\n#37 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Command\\Command.php(318): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Console\\Command.php(180): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(1110): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(359): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(194): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Foundation\\Console\\Kernel.php(197): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Foundation\\Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\artisan(16): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}\n\nNext Illuminate\\Database\\QueryException: SQLSTATE[42S22]: Column not found: 1054 Unknown column \'chat_space_id\' in \'field list\' (Connection: mysql, SQL: update `audit_plans` set `chat_space_id` = spaces/AAQAsbEA_zE, `chat_space_name` = spaces/AAQAsbEA_zE, `chat_space_created_at` = 2025-10-01 01:45:09, `calendar_events` = [{\"id\":\"9s1lettv4u9jut318gr41e3tvc\",\"title\":\"Asset Audit - aa\",\"created_at\":\"2025-10-01T01:45:09.082342Z\",\"attendees_count\":3}], `audit_plans`.`updated_at` = 2025-10-01 01:45:09 where `id` = 1) in C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Connection.php:824\nStack trace:\n#0 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Connection.php(778): Illuminate\\Database\\Connection->runQueryCallback(\'update `audit_p...\', Array, Object(Closure))\n#1 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Connection.php(583): Illuminate\\Database\\Connection->run(\'update `audit_p...\', Array, Object(Closure))\n#2 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Connection.php(535): Illuminate\\Database\\Connection->affectingStatement(\'update `audit_p...\', Array)\n#3 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Query\\Builder.php(3917): Illuminate\\Database\\Connection->update(\'update `audit_p...\', Array)\n#4 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Eloquent\\Builder.php(1266): Illuminate\\Database\\Query\\Builder->update(Object(Illuminate\\Support\\Collection))\n#5 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Eloquent\\Model.php(1316): Illuminate\\Database\\Eloquent\\Builder->update(Array)\n#6 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Eloquent\\Model.php(1233): Illuminate\\Database\\Eloquent\\Model->performUpdate(Object(Illuminate\\Database\\Eloquent\\Builder))\n#7 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Database\\Eloquent\\Model.php(1090): Illuminate\\Database\\Eloquent\\Model->save(Array)\n#8 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\pkg-bu-gws\\src\\Jobs\\CreateAuditNotifications.php(66): Illuminate\\Database\\Eloquent\\Model->update(Array)\n#9 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(36): Bu\\Gws\\Jobs\\CreateAuditNotifications->handle(Object(Bu\\Gws\\Services\\GoogleWorkspaceService))\n#10 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#11 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#12 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#13 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Container.php(836): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#14 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Bus\\Dispatcher.php(132): Illuminate\\Container\\Container->call(Array)\n#15 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(180): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Bu\\Gws\\Jobs\\CreateAuditNotifications))\n#16 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Bu\\Gws\\Jobs\\CreateAuditNotifications))\n#17 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Bus\\Dispatcher.php(136): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#18 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(134): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Bu\\Gws\\Jobs\\CreateAuditNotifications), false)\n#19 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(180): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Bu\\Gws\\Jobs\\CreateAuditNotifications))\n#20 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Bu\\Gws\\Jobs\\CreateAuditNotifications))\n#21 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(127): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#22 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(68): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Object(Bu\\Gws\\Jobs\\CreateAuditNotifications))\n#23 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Jobs\\Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Array)\n#24 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(451): Illuminate\\Queue\\Jobs\\Job->fire()\n#25 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(401): Illuminate\\Queue\\Worker->process(\'database\', Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Object(Illuminate\\Queue\\WorkerOptions))\n#26 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(187): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), \'database\', Object(Illuminate\\Queue\\WorkerOptions))\n#27 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Console\\WorkCommand.php(148): Illuminate\\Queue\\Worker->daemon(\'database\', \'default\', Object(Illuminate\\Queue\\WorkerOptions))\n#28 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Console\\WorkCommand.php(131): Illuminate\\Queue\\Console\\WorkCommand->runWorker(\'database\', \'default\')\n#29 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#30 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#31 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#32 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#33 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Container.php(836): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#34 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Console\\Command.php(211): Illuminate\\Container\\Container->call(Array)\n#35 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Command\\Command.php(318): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#36 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Console\\Command.php(180): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#37 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(1110): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#38 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(359): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#39 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\symfony\\console\\Application.php(194): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Foundation\\Console\\Kernel.php(197): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\vendor\\laravel\\framework\\src\\Illuminate\\Foundation\\Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 C:\\Users\\sumac\\OneDrive\\Documents\\GitHub\\studio\\new-server\\artisan(16): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#43 {main}', '2025-09-30 17:45:09');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `locations`
--

CREATE TABLE `locations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `postal_code` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `manager` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `visible` tinyint(1) NOT NULL DEFAULT 1,
  `order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `locations`
--

INSERT INTO `locations` (`id`, `name`, `address`, `city`, `state`, `country`, `postal_code`, `phone`, `email`, `manager`, `status`, `visible`, `order`, `created_at`, `updated_at`, `parent_id`) VALUES
(1, '札幌事務所', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 1, 0, NULL, NULL, NULL),
(2, '札幌第2事務所', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 1, 1, NULL, NULL, NULL),
(3, '仙台事務所', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 1, 2, NULL, NULL, NULL),
(4, '太平事務所', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 1, 3, NULL, NULL, NULL),
(5, '大阪事務所', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 1, 4, NULL, NULL, NULL),
(6, '東京事務所', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 1, 5, NULL, NULL, NULL),
(7, '福岡事務所', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 1, 6, NULL, NULL, NULL),
(8, '返却済', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 1, 7, NULL, NULL, NULL),
(9, '本人所持', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 1, 8, NULL, NULL, NULL),
(33, 'Testing Location', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', 1, 0, '2025-09-30 17:33:48', '2025-09-30 17:33:48', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2025_08_18_081028_create_assets_table', 1),
(5, '2025_08_18_081033_create_employees_table', 1),
(6, '2025_08_18_081037_create_locations_table', 1),
(7, '2025_08_18_081041_create_projects_table', 1),
(8, '2025_08_18_085615_create_loans_table', 1),
(9, '2025_01_20_000001_create_audit_plans_table', 2),
(10, '2025_01_20_000002_create_audit_assignments_table', 2),
(11, '2025_01_20_000003_create_audit_assets_table', 2),
(12, '2025_01_20_000004_create_audit_logs_table', 2),
(13, '2025_01_20_000005_create_corrective_actions_table', 3),
(14, '2025_01_20_000006_create_corrective_action_assignments_table', 3),
(15, '2025_08_19_000000_modify_assets_serial_number_nullable', 3),
(16, '2025_08_19_000001_make_asset_fields_nullable', 3),
(17, '2025_01_21_000000_add_location_to_employees_table', 4),
(18, '2025_01_21_000001_add_email_to_employees_table', 5),
(19, '2025_01_21_000002_add_projects_to_employees_table', 6),
(20, '2025_08_22_031322_modify_projects_table_simplify_structure', 7),
(21, '2025_01_22_000000_add_visible_and_order_to_locations_table', 8),
(22, '2025_08_24_015952_make_location_fields_nullable', 8),
(23, '2025_08_25_000000_add_order_to_projects_table', 8),
(24, '2025_08_19_000000_change_user_to_user_id_in_assets_table', 9),
(25, '2025_08_19_000001_add_purchase_price_tax_included_to_assets_table', 9),
(26, '2025_01_25_000000_drop_loans_table', 10),
(28, '2025_08_27_000000_update_asset_statuses_to_english', 11),
(29, '2025_01_21_000003_add_audit_status_to_audit_assets_table', 12),
(30, '2025_01_21_000004_modify_current_status_column_in_audit_assets_table', 13),
(31, '2025_01_28_000001_fix_audit_assignments_unique_constraint', 14),
(32, '2025_01_28_000002_update_audit_assets_current_status_column', 15),
(33, '2025_08_28_084641_update_audit_assets_remove_needs_repair_status', 16),
(34, '2025_08_19_000101_add_unique_constraint_to_employees_email', 17),
(35, '2025_09_07_000001_modify_audit_logs_audit_plan_nullable', 18),
(36, '2025_09_07_111127_create_personal_access_tokens_table', 18),
(37, '2025_09_08_000001_add_parent_id_to_locations_table', 18),
(38, '2024_01_01_000000_add_chat_space_to_audit_plans', 19);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `visible` tinyint(1) NOT NULL DEFAULT 1,
  `order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `name`, `description`, `visible`, `order`, `created_at`, `updated_at`) VALUES
(1, 'Test Project', 'A test project', 0, 0, '2025-08-21 17:56:56', '2025-09-09 20:35:47'),
(2, 'All Infrastructure', NULL, 0, 1, NULL, '2025-08-21 19:35:07'),
(3, 'Design', NULL, 0, 2, NULL, '2025-08-21 19:35:07'),
(4, 'Design/Dev', NULL, 0, 3, NULL, '2025-08-21 19:35:08'),
(5, 'Development', NULL, 1, 4, NULL, NULL),
(6, 'Internal Tools', NULL, 1, 5, NULL, NULL),
(7, 'IT', NULL, 1, 6, NULL, NULL),
(8, 'Marketing', NULL, 1, 7, NULL, NULL),
(9, 'Marketing Analytics', NULL, 1, 8, NULL, NULL),
(10, 'Marketing/Design', NULL, 1, 9, NULL, NULL),
(11, 'Project Phoenix', NULL, 1, 10, NULL, NULL),
(12, 'Sales Team', NULL, 1, 11, NULL, NULL),
(13, 'Project Titan', NULL, 1, 12, NULL, NULL),
(14, 'Updated Simple Project', 'Updated description', 0, 13, '2025-08-21 19:16:43', '2025-08-21 19:16:53');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('whEGjDVSnUIcJnabL7BBBcfBWjHLfJqVAXtLMNyn', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.4768', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoia0ZzajVZV1FaOXRlT1JXd3lmVlUyUkZNVTZTNThMR0ZvYVV2ZTVydiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=', 1755523995);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Admin User', 'admin@example.com', NULL, '$2y$12$0zDp4oPV2AVqI7Soz7Httu053..KA46.JPG2IFnLw7b6WaodycWuG', NULL, '2025-08-19 06:20:20', '2025-08-19 06:20:20');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `assets`
--
ALTER TABLE `assets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `assets_asset_id_unique` (`asset_id`),
  ADD KEY `assets_user_id_foreign` (`user_id`);

--
-- Indexes for table `audit_assets`
--
ALTER TABLE `audit_assets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `audit_assets_audit_plan_id_asset_id_unique` (`audit_plan_id`,`asset_id`),
  ADD KEY `audit_assets_audit_plan_id_current_status_index` (`audit_plan_id`,`current_status`),
  ADD KEY `audit_assets_asset_id_index` (`asset_id`),
  ADD KEY `audit_assets_current_status_index` (`current_status`),
  ADD KEY `audit_assets_resolved_index` (`resolved`),
  ADD KEY `audit_assets_audit_status_index` (`audit_status`);

--
-- Indexes for table `audit_assignments`
--
ALTER TABLE `audit_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_audit_assignment` (`audit_plan_id`,`location_id`,`auditor_id`),
  ADD KEY `audit_assignments_location_id_foreign` (`location_id`),
  ADD KEY `audit_assignments_audit_plan_id_location_id_index` (`audit_plan_id`,`location_id`),
  ADD KEY `audit_assignments_auditor_id_index` (`auditor_id`),
  ADD KEY `audit_assignments_status_index` (`status`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_audit_plan_id_action_index` (`audit_plan_id`,`action`),
  ADD KEY `audit_logs_asset_id_index` (`asset_id`),
  ADD KEY `audit_logs_performed_by_index` (`performed_by`),
  ADD KEY `audit_logs_created_at_index` (`created_at`);

--
-- Indexes for table `audit_plans`
--
ALTER TABLE `audit_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_plans_status_due_date_index` (`status`,`due_date`),
  ADD KEY `audit_plans_created_by_index` (`created_by`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `corrective_actions`
--
ALTER TABLE `corrective_actions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `corrective_actions_audit_asset_id_foreign` (`audit_asset_id`),
  ADD KEY `corrective_actions_audit_plan_id_status_index` (`audit_plan_id`,`status`),
  ADD KEY `corrective_actions_audit_plan_id_priority_index` (`audit_plan_id`,`priority`),
  ADD KEY `corrective_actions_due_date_status_index` (`due_date`,`status`);

--
-- Indexes for table `corrective_action_assignments`
--
ALTER TABLE `corrective_action_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `corrective_action_assignments_corrective_action_id_unique` (`corrective_action_id`),
  ADD KEY `corrective_action_assignments_audit_assignment_id_foreign` (`audit_assignment_id`),
  ADD KEY `caa_ca_aa_idx` (`corrective_action_id`,`audit_assignment_id`),
  ADD KEY `caa_employee_idx` (`assigned_to_employee_id`),
  ADD KEY `caa_status_idx` (`status`),
  ADD KEY `caa_assigned_idx` (`assigned_at`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `employees_employee_id_unique` (`employee_id`),
  ADD UNIQUE KEY `employees_email_unique` (`email`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `locations`
--
ALTER TABLE `locations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `locations_parent_id_foreign` (`parent_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `assets`
--
ALTER TABLE `assets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `audit_assets`
--
ALTER TABLE `audit_assets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_assignments`
--
ALTER TABLE `audit_assignments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_plans`
--
ALTER TABLE `audit_plans`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `corrective_actions`
--
ALTER TABLE `corrective_actions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `corrective_action_assignments`
--
ALTER TABLE `corrective_action_assignments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=96;

--
-- AUTO_INCREMENT for table `locations`
--
ALTER TABLE `locations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `assets`
--
ALTER TABLE `assets`
  ADD CONSTRAINT `assets_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `audit_assets`
--
ALTER TABLE `audit_assets`
  ADD CONSTRAINT `audit_assets_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `audit_assets_audit_plan_id_foreign` FOREIGN KEY (`audit_plan_id`) REFERENCES `audit_plans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `audit_assignments`
--
ALTER TABLE `audit_assignments`
  ADD CONSTRAINT `audit_assignments_audit_plan_id_foreign` FOREIGN KEY (`audit_plan_id`) REFERENCES `audit_plans` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `audit_assignments_auditor_id_foreign` FOREIGN KEY (`auditor_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `audit_assignments_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_asset_id_foreign` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `audit_logs_audit_plan_id_foreign` FOREIGN KEY (`audit_plan_id`) REFERENCES `audit_plans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `audit_plans`
--
ALTER TABLE `audit_plans`
  ADD CONSTRAINT `audit_plans_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `corrective_actions`
--
ALTER TABLE `corrective_actions`
  ADD CONSTRAINT `corrective_actions_audit_asset_id_foreign` FOREIGN KEY (`audit_asset_id`) REFERENCES `audit_assets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `corrective_actions_audit_plan_id_foreign` FOREIGN KEY (`audit_plan_id`) REFERENCES `audit_plans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `corrective_action_assignments`
--
ALTER TABLE `corrective_action_assignments`
  ADD CONSTRAINT `corrective_action_assignments_assigned_to_employee_id_foreign` FOREIGN KEY (`assigned_to_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `corrective_action_assignments_audit_assignment_id_foreign` FOREIGN KEY (`audit_assignment_id`) REFERENCES `audit_assignments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `corrective_action_assignments_corrective_action_id_foreign` FOREIGN KEY (`corrective_action_id`) REFERENCES `corrective_actions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `locations`
--
ALTER TABLE `locations`
  ADD CONSTRAINT `locations_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
