import {writeFRXRecord,toBase64} from '../src/project/frx.js';
import {newProject,createControl} from '../src/project/model.js';
const png=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFOcAAAAASUVORK5CYII=','base64'));
const records=[writeFRXRecord(png,'picture'),writeFRXRecord('From FRX: €\r\nSecond line'),writeFRXRecord(['One','Two','€ Three'],'list')];
const off=[0,records[0].length,records[0].length+records[1].length].map(n=>n.toString(16).padStart(4,'0'));
const resourceFiles={
 'Resources.vbp':'Type=Exe\nForm=Main.frm\nStartup="Main"\nName="ResourceIntegration"',
 'Main.frm':`VERSION 5.00
Begin VB.Form Main
 Caption = "FRX Resource Integration"
 ClientWidth = 8500
 ClientHeight = 4400
 Begin VB.Image Image1
  Left = 300
  Top = 300
  Width = 900
  Height = 900
  Stretch = -1
  Picture = "Main.frx":${off[0]}
 End
 Begin VB.PictureBox Picture1
  Left = 1500
  Top = 300
  Width = 2700
  Height = 1200
  Picture = "Main.frx":${off[0]}
 End
 Begin VB.TextBox Text1
  Left = 300
  Top = 1800
  Width = 3600
  Height = 1000
  MultiLine = -1
  Text = $"Main.frx":${off[1]}
 End
 Begin VB.ListBox List1
  Left = 4400
  Top = 300
  Width = 2600
  Height = 2400
  List = "Main.frx":${off[2]}
 End
End
Attribute VB_Name = "Main"
Private Sub Form_Load()
 Picture1.Print "Image plus drawing"
End Sub`,
 'Main.frx':{base64:toBase64(Uint8Array.from(records.flatMap(r=>[...r])))}}
const binary=newProject('BinaryDialogs'),m=binary.modules[0],button=createControl('CommandButton','cmdOpen',300,300),save=createControl('CommandButton','cmdSave',2100,300),label=createControl('Label','lblBytes',300,1100),dialog=createControl('CommonDialog','Dialog1');button.properties.Caption='Open binary';save.properties.Caption='Save binary';label.properties.Width=5000;m.form.controls=[button,save,label,dialog];
m.code=`Option Explicit
Private Sub cmdOpen_Click()
 Dim h As Integer, b As Byte
 Dialog1.ShowOpen
 h = FreeFile
 Open Dialog1.FileName For Binary Access Read As #h
 Get #h, 2, b
 lblBytes.Caption = CStr(LOF(h)) & ":" & CStr(b)
 Close #h
End Sub
Private Sub cmdSave_Click()
 Dialog1.ShowSave
End Sub`;
const binding=newProject('BoundGrid'),bm=binding.modules[0],grid=createControl('DataGrid','Grid1',300,300);grid.properties.Width=7200;grid.properties.Height=4500;bm.form.controls=[grid];
bm.code=`Option Explicit
Private rs As Object
Private Sub Form_Load()
 Set rs=CreateObject("ADODB.Recordset")
 rs.Fields.Append "ID",adInteger
 rs.Fields.Append "Customer",adVarWChar,20
 rs.Fields.Append "Amount",adCurrency
 rs.Open
 rs.AddNew Array("ID","Customer","Amount"),Array(1,"Ada",CCur("1.2345"))
 rs.AddNew Array("ID","Customer","Amount"),Array(2,"Grace",CCur("9.8765"))
 rs.MoveFirst
 Set Grid1.DataSource=rs
End Sub
Private Sub Grid1_BeforeColUpdate(ByVal ColIndex As Integer,ByVal OldValue As Variant,ByRef Cancel As Integer)
 If Grid1.Tag="cancel" Then Cancel=True
End Sub
Private Sub Grid1_AfterColUpdate(ByVal ColIndex As Integer)
 Grid1.Tag="updated"
End Sub`;
console.log(JSON.stringify({resourceFiles,binary,binding}));
