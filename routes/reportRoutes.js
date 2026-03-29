const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const {
  getWeeklyReportPage,
  exportWeeklyCsv
} = require("../controllers/reportController");

router.get("/reports", protect, getWeeklyReportPage);
router.get("/reports/export-csv", protect, exportWeeklyCsv);

module.exports = router;
console.log("reportRoutes loaded");