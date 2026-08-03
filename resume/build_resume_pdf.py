"""Renders the tailored resume markdown into a print-ready PDF.

Usage: python3 resume/build_resume_pdf.py
"""

import re
from pathlib import Path

from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    KeepTogether,
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)

RESUME_MARKDOWN = Path(__file__).parent / "forest-yox-resume-campminder.md"
RESUME_PDF = Path(__file__).parent / "forest-yox-resume-campminder.pdf"

BODY_FONT = "Times-Roman"
BOLD_FONT = "Times-Bold"

styles = {
    "name": ParagraphStyle(
        "name", fontName=BOLD_FONT, fontSize=21, leading=25, alignment=TA_CENTER, spaceAfter=4
    ),
    "contact": ParagraphStyle(
        "contact", fontName=BODY_FONT, fontSize=10.5, leading=13, alignment=TA_CENTER, spaceAfter=6
    ),
    "headline": ParagraphStyle(
        "headline", fontName=BODY_FONT, fontSize=11, leading=14, alignment=TA_CENTER, spaceAfter=7
    ),
    "body": ParagraphStyle(
        "body", fontName=BODY_FONT, fontSize=10, leading=12.8, alignment=TA_LEFT, spaceAfter=5
    ),
    "section": ParagraphStyle(
        "section",
        fontName=BOLD_FONT,
        fontSize=12,
        leading=15,
        alignment=TA_CENTER,
        spaceBefore=11,
        spaceAfter=6,
    ),
    "bullet": ParagraphStyle(
        "bullet", fontName=BODY_FONT, fontSize=10, leading=12.6, alignment=TA_LEFT, spaceAfter=2.5
    ),
    "role": ParagraphStyle(
        "role",
        fontName=BODY_FONT,
        fontSize=10,
        leading=12.8,
        alignment=TA_LEFT,
        spaceBefore=7,
        spaceAfter=4,
        keepWithNext=True,
    ),
}


def to_inline_markup(text):
    escaped = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    bolded = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", escaped)
    return re.sub(r"(?<!\*)\*([^*]+?)\*(?!\*)", r"<i>\1</i>", bolded)


def parse_blocks(markdown_text):
    """Groups hard-wrapped markdown lines into (kind, text) blocks."""
    blocks = []
    pending_paragraph = []

    def flush_paragraph():
        if pending_paragraph:
            blocks.append(("paragraph", " ".join(pending_paragraph)))
            pending_paragraph.clear()

    for line in markdown_text.splitlines():
        stripped = line.strip()
        is_bullet_continuation = line.startswith("  ") and blocks and blocks[-1][0] == "bullet"

        starts_new_labelled_line = stripped.startswith("**") and pending_paragraph

        if not stripped or starts_new_labelled_line:
            flush_paragraph()

        if not stripped:
            continue

        if stripped.startswith("# "):
            flush_paragraph()
            blocks.append(("name", stripped[2:]))
        elif stripped.startswith("## "):
            flush_paragraph()
            blocks.append(("section", stripped[3:]))
        elif stripped.startswith("- "):
            flush_paragraph()
            blocks.append(("bullet", stripped[2:]))
        elif is_bullet_continuation and not pending_paragraph:
            blocks[-1] = ("bullet", f"{blocks[-1][1]} {stripped}")
        else:
            pending_paragraph.append(stripped)

    flush_paragraph()
    return blocks


def to_flowables(blocks):
    flowables = []
    pending_bullets = []
    paragraphs_before_first_section = 0
    reached_first_section = False
    unattached_role_header = None

    def bullet_list(texts, space_after):
        return ListFlowable(
            [ListItem(Paragraph(text, styles["bullet"]), leftIndent=16) for text in texts],
            bulletType="bullet",
            bulletFontSize=6,
            bulletOffsetY=-1.5,
            start="circle",
            leftIndent=16,
            spaceAfter=space_after,
        )

    def flush_bullets():
        """Binds a role header to its first bullet so headers never orphan at a page break."""
        nonlocal unattached_role_header
        if not pending_bullets:
            return
        if unattached_role_header is not None:
            flowables.append(KeepTogether([unattached_role_header, bullet_list(pending_bullets[:1], 2.5)]))
            unattached_role_header = None
            remaining = pending_bullets[1:]
        else:
            remaining = pending_bullets[:]
        if remaining:
            flowables.append(bullet_list(remaining, 4))
        pending_bullets.clear()

    for kind, raw_text in blocks:
        text = to_inline_markup(raw_text)
        if kind == "bullet":
            pending_bullets.append(text)
            continue

        flush_bullets()
        if unattached_role_header is not None:
            flowables.append(unattached_role_header)
            unattached_role_header = None

        if kind == "name":
            flowables.append(Paragraph(text, styles["name"]))
        elif kind == "section":
            reached_first_section = True
            flowables.append(Paragraph(text, styles["section"]))
        elif not reached_first_section:
            paragraphs_before_first_section += 1
            style = "contact" if paragraphs_before_first_section == 1 else "headline"
            style = style if paragraphs_before_first_section <= 2 else "body"
            flowables.append(Paragraph(text, styles[style]))
        elif raw_text.startswith("**") and " | " in raw_text:
            unattached_role_header = Paragraph(text, styles["role"])
        else:
            flowables.append(Paragraph(text, styles["body"]))

    flush_bullets()
    if unattached_role_header is not None:
        flowables.append(unattached_role_header)
    return flowables


def build_pdf():
    blocks = parse_blocks(RESUME_MARKDOWN.read_text())
    document = SimpleDocTemplate(
        str(RESUME_PDF),
        pagesize=letter,
        leftMargin=0.72 * inch,
        rightMargin=0.72 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.55 * inch,
        title="Forest Yox — Resume",
        author="Forest Yox",
    )
    document.build(to_flowables(blocks) + [Spacer(1, 1)])
    print(f"Wrote {RESUME_PDF}")


if __name__ == "__main__":
    build_pdf()
