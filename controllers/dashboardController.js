const ScreenTime = require("../models/ScreenTime");
const User = require("../models/User");

const getProductivityScore = (todayTotal, warningLimit, dangerLimit) => {
  if (todayTotal === 0) return 100;
  if (todayTotal < warningLimit) return 95;
  if (todayTotal >= warningLimit && todayTotal < dangerLimit) return 70;
  return 40;
};

const getUsageStatus = (todayTotal, warningLimit, dangerLimit) => {
  if (todayTotal < warningLimit) return "Healthy";
  if (todayTotal >= warningLimit && todayTotal < dangerLimit) return "Approaching Limit";
  return "Limit Reached";
};

const getHomePage = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.render("store/homePage", {
        userName: null,
        userId: null,
        todayTotal: 0,
        totalEntries: 0,
        recentEntries: [],
        chartLabels: [],
        chartData: [],
        productivityScore: 100,
        usageStatus: "Healthy",
        currentStreak: 0,
        bestStreak: 0,
        timeLeft: 0,
        mostUsedCategory: "No data",
        warningLimit: 0,
        dangerLimit: 0,
        dailyLimit: 0,
        progressPercent: 0,
      });
    }

    const user = await User.findById(req.session.userId);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayEntries = await ScreenTime.find({
      user: req.session.userId,
      date: { $gte: startOfToday },
    });

    const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.hours, 0);

    const totalEntries = await ScreenTime.countDocuments({
      user: req.session.userId,
    });

    const recentEntries = await ScreenTime.find({
      user: req.session.userId,
    })
      .sort({ createdAt: -1 })
      .limit(6);

    const todayCategoryTotals = {
      "Social Media": 0,
      Entertainment: 0,
      Study: 0,
      Gaming: 0,
      Other: 0,
    };

    todayEntries.forEach((entry) => {
      if (todayCategoryTotals[entry.category] !== undefined) {
        todayCategoryTotals[entry.category] += entry.hours;
      }
    });

    let mostUsedCategory = "No data";
    let maxCategoryHours = 0;

    Object.entries(todayCategoryTotals).forEach(([category, hours]) => {
      if (hours > maxCategoryHours) {
        maxCategoryHours = hours;
        mostUsedCategory = category;
      }
    });

    const productivityScore = getProductivityScore(
      todayTotal,
      user.warningLimit,
      user.dangerLimit
    );

    const usageStatus = getUsageStatus(
      todayTotal,
      user.warningLimit,
      user.dangerLimit
    );

    const timeLeft = Math.max(user.dailyLimit - todayTotal, 0);
    const progressPercent = Math.min((todayTotal / user.dailyLimit) * 100, 100);

    res.render("store/homePage", {
      userName: req.session.userName || null,
      userId: req.session.userId,
      todayTotal: Number(todayTotal.toFixed(2)),
      totalEntries,
      recentEntries,
      chartLabels: Object.keys(todayCategoryTotals),
      chartData: Object.values(todayCategoryTotals),
      productivityScore,
      usageStatus,
      currentStreak: user.currentStreak || 0,
      bestStreak: user.bestStreak || 0,
      timeLeft: Number(timeLeft.toFixed(2)),
      mostUsedCategory,
      warningLimit: user.warningLimit,
      dangerLimit: user.dangerLimit,
      dailyLimit: user.dailyLimit,
      progressPercent: Number(progressPercent.toFixed(1)),
    });
  } catch (error) {
    console.error(error);
    res.render("store/homePage", {
      userName: req.session.userName || null,
      userId: req.session.userId || null,
      todayTotal: 0,
      totalEntries: 0,
      recentEntries: [],
      chartLabels: [],
      chartData: [],
      productivityScore: 100,
      usageStatus: "Healthy",
      currentStreak: 0,
      bestStreak: 0,
      timeLeft: 0,
      mostUsedCategory: "No data",
      warningLimit: 0,
      dangerLimit: 0,
      dailyLimit: 0,
      progressPercent: 0,
    });
  }
};

module.exports = { getHomePage };