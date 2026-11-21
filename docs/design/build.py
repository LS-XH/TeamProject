"""Build the two design PDFs and the editable draw.io prototype."""
from pathlib import Path
from xml.etree.ElementTree import Element, SubElement, ElementTree
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Image, KeepTogether

ROOT = Path(__file__).resolve().parent
INK = "#211C39"
ACCENT = "#5945B6"
pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
styles = {
    "#": ParagraphStyle("title", fontName="STSong-Light", fontSize=27, leading=38, textColor=colors.HexColor(INK), spaceAfter=12, wordWrap="CJK"),
    "##": ParagraphStyle("heading", fontName="STSong-Light", fontSize=16, leading=23, textColor=colors.HexColor(ACCENT), spaceBefore=16, spaceAfter=9, keepWithNext=True, wordWrap="CJK"),
    "body": ParagraphStyle("body", fontName="STSong-Light", fontSize=11, leading=18, spaceAfter=8, wordWrap="CJK"),
}
captions = dict(usecase="图1 用例图", activity="图2 活动图", classes="图3 类图",
                sequence="图4 时序图", collaboration="图5 协作图", er="图1 实体联系图")


def footer(canvas, document):
    canvas.setFont("STSong-Light", 9)
    canvas.setFillColor(colors.HexColor(ACCENT))
    canvas.drawString(44, 28, "海底小纵队  /  课题搭子")
    canvas.drawRightString(551, 28, str(document.page))


for key, name in [("system", "系统设计说明书"), ("database", "数据库设计说明书")]:
    story = []
    for line in (ROOT / (key + ".md")).read_text("utf-8").splitlines():
        if line.startswith("@"):
            path = ROOT / line[1:]
            picture = Image(str(path))
            ratio = min(500 / picture.imageWidth, 410 / picture.imageHeight)
            picture.drawWidth = picture.imageWidth * ratio
            picture.drawHeight = picture.imageHeight * ratio
            story.append(KeepTogether([picture, Paragraph(captions[path.stem], styles["body"])]))
        elif line:
            prefix = line.split(" ", 1)[0]
            story.append(Paragraph(escape(line[len(prefix)+1:] if prefix in ("#", "##") else line), styles.get(prefix, styles["body"])))
    doc = SimpleDocTemplate(str(ROOT / ("海底小纵队_" + name + ".pdf")),
                            title="海底小纵队 " + name, author="海底小纵队",
                            pagesize=(595, 842), leftMargin=44, rightMargin=44)
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


screens = [
    ("input", "前台 / 项目总览", "从作业原文创建可追溯计划", "原始要求", "应用须公开上线，供教师和助教访问。\n提交博客与两份设计说明书。", "离线规则 · 示例正文", "生成预览", "review"),
    ("review", "前台 / 需求核对", "逐条确认原文引用与验收条件", "R001  应用公开上线", "原文：应用须公开上线，供教师和助教访问。\n验收：在匿名浏览器打开演示页面。\n当前预览。确认后保存版本1。", "来源已定位 · 必做需求", "保存并安排任务", "tasks"),
    ("tasks", "前台 / 任务安排", "课程演示站点交付", "T001  发布演示站点", "关联 R001  ·  负责人：示例成员\n状态：已完成\n交付证据：未填写", "已分配 · 待核验证据", "运行交付体检", "audit"),
    ("audit", "前台 / 交付体检", "完成状态缺少证据", "T001  缺少交付证据", "任务覆盖率 100%  ·  有证据完成率 0%\n已安排发布任务。请补充可访问的演示地址。", "1 项待处理", "填写示例证据", "resolved"),
    ("resolved", "前台 / 证据已补齐", "核对后可导出交付报告", "T001  证据已记录", "任务覆盖率 100%  ·  有证据完成率 100%\n证据：演示站点链接（示例）\n验收人仍需打开链接确认。", "体检通过 · 待人工验收", "返回项目总览", "input"),
    ("admin", "后台 / 项目管理", "管理团队项目状态", "课程演示工作区", "状态：使用中\n成员：3（示例）\n归档保留历史版本。归档期间项目只读。", "管理员角色演示", "查看归档确认", "confirm"),
    ("confirm", "后台 / 归档确认", "归档课程演示工作区？", "确认归档", "成员仍可查看和导出历史记录。\n归档期间禁止编辑任务及生成新版本。\n系统将记录本次操作。", "可恢复", "确认归档", "archived"),
    ("archived", "后台 / 操作日志", "项目已归档", "归档操作已记录", "状态：已归档 · 项目只读\n操作人：演示管理员\n事件：归档课程演示工作区", "成功回执 · 演示记录", "模拟恢复", "admin"),
]


def add(model, key, title, lead, label, copy, status, action, target):
    graph = SubElement(model, "mxGraphModel", page="1", pageWidth="1000", pageHeight="640", grid="0")
    root = SubElement(graph, "root")
    SubElement(root, "mxCell", id="0")
    SubElement(root, "mxCell", id="1", parent="0")
    counter = 1

    def block(value, x, y, w, h, fill, color, size, bold=False, link=None, align="left"):
        nonlocal counter
        counter += 1
        parent = root
        attrs = {"id": str(counter), "value": value}
        if link:
            parent = SubElement(root, "object", id=str(counter), label=value, link="data:page/id," + link)
            attrs = {}
        style = (f"rounded=1;arcSize=12;whiteSpace=wrap;html=1;strokeColor=none;"
                 f"fillColor={fill};fontColor={color};fontSize={size};fontStyle={int(bold)};"
                 f"fontFamily=Microsoft YaHei;align={align};spacingLeft=16;")
        cell = SubElement(parent, "mxCell", **attrs, style=style, vertex="1", parent="1")
        SubElement(cell, "mxGeometry", x=str(x), y=str(y), width=str(w), height=str(h), **{"as": "geometry"})

    block("", 20, 20, 950, 585, "#F5F3FB", INK, 12)
    block("课题搭子", 42, 47, 186, 54, INK, "#FFFFFF", 23, True)
    block("前台工作台", 42, 125, 186, 50, "#E8E2FC", ACCENT, 17, True, "input")
    block("后台管理", 42, 185, 186, 50, "#E8E2FC", ACCENT, 17, True, "admin")
    block(title, 250, 48, 660, 52, "#F5F3FB", INK, 29, True)
    block(lead, 250, 104, 660, 40, "#F5F3FB", "#625678", 19)
    block("", 250, 165, 680, 307, "#FFFFFF", INK, 12)
    block(label, 268, 187, 634, 61, "#FFFFFF", INK, 28, True)
    block("<br>".join(escape(row) for row in copy.splitlines()), 268, 250, 634, 135, "#FFFFFF", INK, 20)
    block(status, 268, 401, 410, 43, "#E8F4EC", "#235D43", 17)
    block(action + "  →", 658, 503, 272, 64, ACCENT, "#FFFFFF", 19, True, target)
    if key == "confirm":
        block("取消", 496, 503, 144, 64, "#E8E2FC", ACCENT, 19, True, "admin")


file = Element("mxfile", host="app.diagrams.net", compressed="false")
for screen in screens:
    page = SubElement(file, "diagram", id=screen[0], name=screen[1])
    add(page, *screen)
tree = ElementTree(file)
tree.write(ROOT / "课题搭子.drawio", encoding="utf-8", xml_declaration=True)
