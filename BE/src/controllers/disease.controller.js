const diseaseModel = require('../models/disease.model');

const buildDiseasePayload = (req) => {
    const body = req.body || {};
    const normalize = (value) =>
        value === undefined || value === null || value === 'null' || value === 'undefined'
            ? null
            : value;

    const payload = {
        disease_code: normalize(body.disease_code),
        disease_name_vi: normalize(body.disease_name_vi),
        description: normalize(body.description),
        symptoms: normalize(body.symptoms),
        identification_signs: normalize(body.identification_signs),
        prevention_measures: normalize(body.prevention_measures),
        treatments_medications: normalize(body.treatments_medications),
        dietary_advice: normalize(body.dietary_advice),
        source_references: normalize(body.source_references),
    };

    const uploadedUrl = req.file?.secure_url || req.file?.url || req.file?.path || null;
    payload.image_url = uploadedUrl || normalize(body.image_url) || normalize(body.imageUrl);

    return payload;
};

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
            const payload = buildDiseasePayload(req);

            if (!payload.disease_code || !payload.disease_name_vi) {
                return res.status(400).json({ message: 'Mã bệnh và tên bệnh là bắt buộc.' });
            }

            const id = await diseaseModel.create(payload);
            res.status(201).json({ message: 'Thêm bệnh thành công', id });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi tạo bệnh', error: error.message });
        }
    },

    // (Admin) Sửa
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const payload = buildDiseasePayload(req);

            if (!payload.disease_code || !payload.disease_name_vi) {
                return res.status(400).json({ message: 'Mã bệnh và tên bệnh là bắt buộc.' });
            }

            await diseaseModel.update(id, payload);
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