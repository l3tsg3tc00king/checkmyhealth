const diseaseModel = require('../models/disease.model');

const diseaseController = {
    // Lấy danh sách
    getList: async (req, res) => {
        try {
            const { search } = req.query;
            const list = await diseaseModel.getAll(search);
            res.status(200).json(list);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    },

    // Lấy chi tiết
    getDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const item = await diseaseModel.getById(id);
            if (!item) return res.status(404).json({ message: 'Không tìm thấy bệnh này' });
            res.status(200).json(item);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
        }
    },

    // (Admin) Tạo mới
    create: async (req, res) => {
        try {
            const id = await diseaseModel.create(req.body);
            res.status(201).json({ message: 'Thêm bệnh thành công', id });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi tạo bệnh', error: error.message });
        }
    },

    // (Admin) Sửa
    update: async (req, res) => {
        try {
            const { id } = req.params;
            await diseaseModel.update(id, req.body);
            res.status(200).json({ message: 'Cập nhật thành công' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi cập nhật', error: error.message });
        }
    },

    // (Admin) Xóa
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            await diseaseModel.delete(id);
            res.status(200).json({ message: 'Xóa thành công' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi xóa', error: error.message });
        }
    }
};

module.exports = diseaseController;