const ScreenTime = require("../models/ScreenTime");
const User = require("../models/User");

const getWeeklyReport = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const weeklyEntries = await ScreenTime.find({
      user: req.session.userId,
      date: { $gte: sevenDaysAgo },
    }).sort({ date: 1 });

    const weeklyTotal = weeklyEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const averageDailyUsage = weeklyTotal / 7;

    const categoryTotals = {
      "Social Media": 0,
      Entertainment: 0,
      Study: 0,
      Gaming: 0,
      Other: 0,
    };

    weeklyEntries.forEach((entry) => {
      if (categoryTotals[entry.category] !== undefined) {
        categoryTotals[entry.category] += entry.hours;
      }
    });

    let topCategory = "No data";
    let maxHours = 0;

    Object.entries(categoryTotals).forEach(([category, hours]) => {
      if (hours > maxHours) {
        maxHours = hours;
        topCategory = category;
      }
    });

    const dailyMap = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + i);
      dailyMap[date.toDateString()] = 0;
    }

    weeklyEntries.forEach((entry) => {
      const key = new Date(entry.date).toDateString();
      if (dailyMap[key] !== undefined) {
        dailyMap[key] += entry.hours;
      }
    });

    const dailyLabels = Object.keys(dailyMap).map((dateStr) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { weekday: "short" });
    });

    const dailyData = Object.values(dailyMap).map((value) =>
      Number(value.toFixed(2))
    );

    let highestUsageDay = "No data";
    let highestUsageValue = 0;
    let lowestUsageDay = "No data";
    let lowestUsageValue = Number.MAX_SAFE_INTEGER;

    Object.entries(dailyMap).forEach(([dateStr, value]) => {
      if (value > highestUsageValue) {
        highestUsageValue = value;
        highestUsageDay = new Date(dateStr).toLocaleDateString("en-US", {
          weekday: "long",
        });
      }

      if (value < lowestUsageValue) {
        lowestUsageValue = value;
        lowestUsageDay = new Date(dateStr).toLocaleDateString("en-US", {
          weekday: "long",
        });
      }
    });

    const usageTrend =
      averageDailyUsage <= user.warningLimit
        ? "Improving"
        : averageDailyUsage < user.dangerLimit
        ? "Moderate"
        : "Needs Attention";

    res.render("store/weeklyReport", {
      userName: req.session.userName || null,
      weeklyTotal: Number(weeklyTotal.toFixed(2)),
      averageDailyUsage: Number(averageDailyUsage.toFixed(2)),
      categoryTotals,
      topCategory,
      weeklyEntries,
      dailyLabels,
      dailyData,
      highestUsageDay,
      lowestUsageDay,
      usageTrend,
      warningLimit: user.warningLimit,
      dangerLimit: user.dangerLimit,
    });
  } catch (error) {
    console.error(error);
    res.render("store/weeklyReport", {
      userName: req.session.userName || null,
      weeklyTotal: 0,
      averageDailyUsage: 0,
      categoryTotals: {
        "Social Media": 0,
        Entertainment: 0,
        Study: 0,
        Gaming: 0,
        Other: 0,
      },
      topCategory: "No data",
      weeklyEntries: [],
      dailyLabels: [],
      dailyData: [],
      highestUsageDay: "No data",
      lowestUsageDay: "No data",
      usageTrend: "No data",
      warningLimit: 0,
      dangerLimit: 0,
    });
  }
};

module.exports = { getWeeklyReport };