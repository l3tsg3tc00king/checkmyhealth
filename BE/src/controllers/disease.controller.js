const diseaseModel = require('../models/disease.model');
const XLSX = require('xlsx');

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
    },

    // (Admin) Export tất cả bệnh ra Excel/CSV
    exportAll: async (req, res) => {
        try {
            const { format = 'xlsx' } = req.query; // 'xlsx' hoặc 'csv'
            const diseases = await diseaseModel.getAllForExport();

            if (diseases.length === 0) {
                return res.status(404).json({ message: 'Không có dữ liệu để export' });
            }

            // Tạo workbook
            const worksheet = XLSX.utils.json_to_sheet(diseases);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Bệnh lý');

            if (format === 'csv') {
                const csv = XLSX.utils.sheet_to_csv(worksheet);
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="diseases_export_${Date.now()}.csv"`);
                res.send('\ufeff' + csv); // BOM cho UTF-8
            } else {
                const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename="diseases_export_${Date.now()}.xlsx"`);
                res.send(buffer);
            }
        } catch (error) {
            console.error('Export error:', error);
            res.status(500).json({ message: 'Lỗi export', error: error.message });
        }
    },

    // (Admin) Export sample template
    exportSample: async (req, res) => {
        try {
            const { format = 'xlsx' } = req.query;
            
            // Tạo dữ liệu mẫu
            const sampleData = [{
                disease_code: 'Nevus',
                disease_name_vi: 'Nốt ruồi',
                description: 'Mô tả về bệnh...',
                symptoms: 'Triệu chứng...',
                identification_signs: 'Dấu hiệu nhận biết...',
                prevention_measures: 'Biện pháp phòng ngừa...',
                treatments_medications: 'Điều trị và thuốc...',
                dietary_advice: 'Lời khuyên về chế độ ăn...',
                source_references: 'Nguồn tham khảo...',
                image_url: ''
            }];

            const worksheet = XLSX.utils.json_to_sheet(sampleData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Bệnh lý');

            if (format === 'csv') {
                const csv = XLSX.utils.sheet_to_csv(worksheet);
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', 'attachment; filename="diseases_template.csv"');
                res.send('\ufeff' + csv);
            } else {
                const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename="diseases_template.xlsx"');
                res.send(buffer);
            }
        } catch (error) {
            console.error('Export sample error:', error);
            res.status(500).json({ message: 'Lỗi export template', error: error.message });
        }
    },

    // (Admin) Import bệnh từ Excel/CSV
    import: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'Vui lòng upload file Excel hoặc CSV' });
            }

            const fileBuffer = req.file.buffer;
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);

            if (data.length === 0) {
                return res.status(400).json({ message: 'File không có dữ liệu' });
            }

            // Validate và normalize dữ liệu
            const diseases = [];
            const errors = [];

            data.forEach((row, index) => {
                const rowNum = index + 2; // +2 vì có header và index bắt đầu từ 0
                
                if (!row.disease_code || !row.disease_name_vi) {
                    errors.push(`Dòng ${rowNum}: Thiếu mã bệnh hoặc tên bệnh`);
                    return;
                }

                diseases.push({
                    disease_code: String(row.disease_code).trim(),
                    disease_name_vi: String(row.disease_name_vi).trim(),
                    description: row.description ? String(row.description).trim() : null,
                    symptoms: row.symptoms ? String(row.symptoms).trim() : null,
                    identification_signs: row.identification_signs ? String(row.identification_signs).trim() : null,
                    prevention_measures: row.prevention_measures ? String(row.prevention_measures).trim() : null,
                    treatments_medications: row.treatments_medications ? String(row.treatments_medications).trim() : null,
                    dietary_advice: row.dietary_advice ? String(row.dietary_advice).trim() : null,
                    source_references: row.source_references ? String(row.source_references).trim() : null,
                    image_url: row.image_url ? String(row.image_url).trim() : null
                });
            });

            if (errors.length > 0) {
                return res.status(400).json({ 
                    message: 'Có lỗi trong dữ liệu', 
                    errors 
                });
            }

            if (diseases.length === 0) {
                return res.status(400).json({ message: 'Không có dữ liệu hợp lệ để import' });
            }

            // Kiểm tra duplicate
            const diseaseCodes = diseases.map(d => d.disease_code).filter(Boolean);
            const existingDiseases = await diseaseModel.checkDuplicates(diseaseCodes);
            const existingCodes = new Set(existingDiseases.map(d => d.disease_code));
            
            const duplicates = diseases.filter(d => existingCodes.has(d.disease_code));
            const newDiseases = diseases.filter(d => !existingCodes.has(d.disease_code));

            // Import các bệnh không trùng vào database
            let insertedCount = 0;
            if (newDiseases.length > 0) {
                insertedCount = await diseaseModel.bulkCreate(newDiseases);
            }

            // Trả về kết quả với thông tin duplicate
            const response = {
                message: duplicates.length > 0 
                    ? `Import thành công ${insertedCount} bệnh lý. Phát hiện ${duplicates.length} bệnh trùng lặp.`
                    : `Import thành công ${insertedCount} bệnh lý`,
                imported: insertedCount,
                total: diseases.length,
                duplicates: duplicates.map(d => ({
                    disease_code: d.disease_code,
                    disease_name_vi: d.disease_name_vi,
                    existing_name: existingDiseases.find(e => e.disease_code === d.disease_code)?.disease_name_vi
                })),
                duplicates_count: duplicates.length,
                new_count: newDiseases.length
            };

            res.status(200).json(response);
        } catch (error) {
            console.error('Import error:', error);
            res.status(500).json({ message: 'Lỗi import', error: error.message });
        }
    }
};

module.exports = diseaseController;