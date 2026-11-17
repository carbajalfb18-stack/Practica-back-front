import controller from "../controllers/modelos.constroller.js";
import express from 'express';

const router = express.Router();

router.get('/',controller.findAll);
router.get('/:id',controller.findOne);
router.post('/',controller.create);
router.put('/',controller.update);
router.delete('/:id',controller.remove);

export default router;