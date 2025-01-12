const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
const { checkUserInDb } = require('../utils/db');

const homeController = require('../controllers/homeController');
const gameController = require('../controllers/gameController');
const rulesController = require('../controllers/rulesController');
const roomController = require('../controllers/roomController');
const withdrawController = require('../controllers/withdrawController');
const userController = require('../controllers/userController');
const referalsController = require('../controllers/referalsController');
const ordersController = require('../controllers/ordersController');

const excludedRoutes = [
    '/newyork1789/update-order-status',
    '/check-user',
    '/',
    '/newyork1789',
    '/newyork1789/orders',
    '/newyork1789/orders-data',
    '/updateGameStats01',
    '/newyork1789/verify-password'
];

router.use((req, res, next) => {
    if (!excludedRoutes.includes(req.path)) {
        return checkUserInDb(req, res, next);
    }
    next();
});

router.get('/', homeController.getIndex);
router.get('/home', homeController.getHome);
router.get('/room', roomController.getRoom);
router.get('/game-01', gameController.getGame01);
router.get('/game-03', gameController.getGame03);
router.get('/game-05', gameController.getGame05);
router.get('/game-08', gameController.getGame08);
router.get('/game-1', gameController.getGame1);
router.get('/rules', rulesController.getRules);
router.get('/referals', referalsController.getReferals);
router.get('/referals/history', referalsController.getWithdrawHistory);
router.get('/balance', withdrawController.getWithdraw);
router.get('/balance/history', withdrawController.getWithdrawHistory);
router.get('/balance/deposit', withdrawController.getDeposit);
router.get('/newyork1789', ordersController.showPasswordPage);
router.get('/newyork1789/orders', ordersController.showOrdersPage);
router.get('/newyork1789/orders-data', ordersController.getOrdersData);

router.post('/check-user', userController.checkUser);
router.post('/referals/getData', referalsController.getTotalReferals);
router.post('/balance/getData', withdrawController.getData);
router.post('/balance/createOrder', withdrawController.createOrder);
router.post('/balance/updateStartPageBalance', withdrawController.updateStartPageBalance);
router.post('/referals/createOrder', referalsController.createReferralOrder);
router.post('/updateGameStats01', gameController.updateGameStats01);
router.post('/updateGameStats03', gameController.updateGameStats03);
router.post('/updateGameStats05', gameController.updateGameStats05);
router.post('/updateGameStats08', gameController.updateGameStats08);
router.post('/updateGameStats1', gameController.updateGameStats1);
router.post('/getChanceGames', gameController.getChanceGames);
router.post('/updateChanceGames', gameController.updateChanceGames);
router.post('/newyork1789/verify-password', ordersController.verifyPassword, csrfProtection);
router.post('/withdraw/getWithdrawHistoryOrders', withdrawController.getWithdrawHistoryOrders);
router.post('/referals/getReferalsHistoryOrders', referalsController.getReferalsHistoryOrders);
router.post('/newyork1789/update-order-status', ordersController.updateOrderStatus);

module.exports = router;
