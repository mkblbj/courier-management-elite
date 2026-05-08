const express = require('express');
const {
  ShippingTrackingNumberController,
  validateCreateTrackingNumber,
  validateUpdateTrackingNumber
} = require('../controllers/ShippingTrackingNumberController');

const router = express.Router();

router.get('/stats', ShippingTrackingNumberController.getStats.bind(ShippingTrackingNumberController));
router.get('/', ShippingTrackingNumberController.getAll.bind(ShippingTrackingNumberController));
router.post('/', validateCreateTrackingNumber, ShippingTrackingNumberController.create.bind(ShippingTrackingNumberController));
router.put('/:id', validateUpdateTrackingNumber, ShippingTrackingNumberController.update.bind(ShippingTrackingNumberController));
router.delete('/batch/:batchId', ShippingTrackingNumberController.deleteBatch.bind(ShippingTrackingNumberController));
router.delete('/:id', ShippingTrackingNumberController.delete.bind(ShippingTrackingNumberController));

module.exports = router;
