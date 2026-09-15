# -*- coding: utf-8 -*-
"""Genera las 'lapidas' que sustituyen a los descargables borrados de public/recursos/.

El hosting de Lovable NO borra ficheros al desplegar: solo anade y sobrescribe. Borrar
public/recursos/ del repo (commit 4076adb) no los retiro de portal.farmapro.es. La unica
via que controlamos nosotros es sobrescribir cada nombre con un fichero valido e inocuo.
"""
import io, os, zipfile

RAIZ = '/Users/francescfernandez/farmapro/farmapro-portal/public/recursos'
L1 = 'Este archivo ya no esta disponible en esta direccion.'
L2 = 'Los materiales de farmapro se descargan desde el portal, con tu cuenta:'
L3 = 'portal.farmapro.es/recursos'

def pdf():
    def esc(t): return t.replace('\\', r'\\').replace('(', r'\(').replace(')', r'\)')
    cont = ('BT /F1 13 Tf 60 720 Td (%s) Tj ET\n'
            'BT /F1 11 Tf 60 694 Td (%s) Tj ET\n'
            'BT /F1 11 Tf 60 674 Td (%s) Tj ET\n') % (esc(L1), esc(L2), esc(L3))
    cont = cont.encode('latin-1')
    objs = [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] '
        b'/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
        b'<< /Length ' + str(len(cont)).encode() + b' >>\nstream\n' + cont + b'endstream',
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ]
    out = io.BytesIO(); out.write(b'%PDF-1.4\n'); offs = []
    for i, o in enumerate(objs, 1):
        offs.append(out.tell())
        out.write(str(i).encode() + b' 0 obj\n' + o + b'\nendobj\n')
    xref = out.tell()
    out.write(b'xref\n0 ' + str(len(objs) + 1).encode() + b'\n0000000000 65535 f \n')
    for o in offs:
        out.write(('%010d 00000 n \n' % o).encode())
    out.write(b'trailer\n<< /Size ' + str(len(objs) + 1).encode() + b' /Root 1 0 R >>\nstartxref\n'
              + str(xref).encode() + b'\n%%EOF\n')
    return out.getvalue()

def zipdoc(pares):
    b = io.BytesIO()
    with zipfile.ZipFile(b, 'w', zipfile.ZIP_DEFLATED) as z:
        for n, c in pares:
            z.writestr(n, c)
    return b.getvalue()

def xlsx():
    ct = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
          '<Default Extension="xml" ContentType="application/xml"/>'
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
          '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
          '</Types>')
    rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            '</Relationships>')
    wb = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
          'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
          '<sheets><sheet name="Aviso" sheetId="1" r:id="rId1"/></sheets></workbook>')
    wbrels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
              '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
              '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
              '</Relationships>')
    filas = ''.join(
        '<row r="%d"><c r="A%d" t="inlineStr"><is><t>%s</t></is></c></row>' % (i, i, t)
        for i, t in enumerate([L1, L2, L3], 1))
    sh = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
          '<sheetData>' + filas + '</sheetData></worksheet>')
    return zipdoc([('[Content_Types].xml', ct), ('_rels/.rels', rels),
                   ('xl/workbook.xml', wb), ('xl/_rels/workbook.xml.rels', wbrels),
                   ('xl/worksheets/sheet1.xml', sh)])

def docx():
    ct = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
          '<Default Extension="xml" ContentType="application/xml"/>'
          '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
          '</Types>')
    rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
            '</Relationships>')
    paras = ''.join('<w:p><w:r><w:t xml:space="preserve">%s</w:t></w:r></w:p>' % t for t in (L1, L2, L3))
    doc = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
           '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
           '<w:body>' + paras + '</w:body></w:document>')
    return zipdoc([('[Content_Types].xml', ct), ('_rels/.rels', rels), ('word/document.xml', doc)])

cuerpos = {'pdf': pdf(), 'xlsx': xlsx(), 'docx': docx()}
os.makedirs(RAIZ, exist_ok=True)
n = 0
for linea in io.open('/tmp/rec69.txt', encoding='utf-8'):
    f = linea.strip()
    if not f:
        continue
    ext = f.rsplit('.', 1)[-1].lower()
    if ext not in cuerpos:
        raise SystemExit('extension inesperada: ' + f)
    io.open(os.path.join(RAIZ, f), 'wb').write(cuerpos[ext])
    n += 1
print('lapidas escritas:', n)
for e, c in cuerpos.items():
    print(' ', e, len(c), 'bytes')
