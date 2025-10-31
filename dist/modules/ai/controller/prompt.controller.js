"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTemplatesController = listTemplatesController;
exports.renderTemplateController = renderTemplateController;
const templates_1 = require("../templates/templates");
async function listTemplatesController(_req, res) {
    const list = templates_1.TEMPLATES.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        ratio: t.ratio,
        fields: t.fields,
    }));
    res.status(200).json({ templates: list });
}
async function renderTemplateController(req, res) {
    const { templateId, fields } = req.body;
    const tpl = templates_1.TEMPLATES.find(t => t.id === templateId);
    if (!tpl)
        return res.status(404).json({ message: 'Template not found' });
    const finalPrompt = tpl.render(fields || {});
    res.status(200).json({
        finalPrompt,
        negativePrompt: tpl.defaults.negative,
        params: tpl.defaults.params,
    });
}
