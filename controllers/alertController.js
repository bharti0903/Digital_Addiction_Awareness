const Alert = require("../models/Alert");
const ScreenTime = require("../models/ScreenTime");
const User = require("../models/User");

const getAlertsPage = async (req, res) => {
  try {
    const alerts = await Alert.find({ user: req.session.userId }).sort({ createdAt: -1 });
    const user = await User.findById(req.session.userId);

    const unreadCount = alerts.filter((alert) => !alert.isRead).length;
    const dangerCount = alerts.filter((alert) => alert.type === "danger").length;
    const warningCount = alerts.filter((alert) => alert.type === "warning").length;
    const infoCount = alerts.filter((alert) => alert.type === "info").length;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayEntries = await ScreenTime.find({
      user: req.session.userId,
      date: { $gte: startOfToday },
    });

    const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const progressPercent = Math.min((todayTotal / user.dailyLimit) * 100, 100);

    let limitStatus = "Healthy";
    if (todayTotal >= user.warningLimit && todayTotal < user.dangerLimit) {
      limitStatus = "Approaching Limit";
    } else if (todayTotal >= user.dangerLimit) {
      limitStatus = "Limit Reached";
    }

    res.render("store/smartAlerts", {
      userName: req.session.userName || null,
      alerts,
      unreadCount,
      totalCount: alerts.length,
      dangerCount,
      warningCount,
      infoCount,
      todayTotal: Number(todayTotal.toFixed(2)),
      dailyLimit: user.dailyLimit,
      warningLimit: user.warningLimit,
      dangerLimit: user.dangerLimit,
      progressPercent: Number(progressPercent.toFixed(1)),
      limitStatus,
    });
  } catch (error) {
    console.error(error);
    res.render("store/smartAlerts", {
      userName: req.session.userName || null,
      alerts: [],
      unreadCount: 0,
      totalCount: 0,
      dangerCount: 0,
      warningCount: 0,
      infoCount: 0,
      todayTotal: 0,
      dailyLimit: 0,
      warningLimit: 0,
      dangerLimit: 0,
      progressPercent: 0,
      limitStatus: "Healthy",
    });
  }
};

const markAlertAsRead = async (req, res) => {
  try {
    await Alert.findOneAndUpdate(
      { _id: req.params.id, user: req.session.userId },
      { isRead: true }
    );

    res.redirect("/smart-alerts");
  } catch (error) {
    console.error(error);
    res.redirect("/smart-alerts");
  }
};

const markAllAlertsAsRead = async (req, res) => {
  try {
    await Alert.updateMany(
      { user: req.session.userId, isRead: false },
      { isRead: true }
    );

    res.redirect("/smart-alerts");
  } catch (error) {
    console.error(error);
    res.redirect("/smart-alerts");
  }
};

module.exports = {
  getAlertsPage,
  markAlertAsRead,
  markAllAlertsAsRead,
};