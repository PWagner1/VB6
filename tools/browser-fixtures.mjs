// Deterministic test projects, generated from the same public model API as the IDE.
import {newProject,createControl,createForm,BASIC_CONTROL_TYPES,EXTENDED_CONTROL_TYPES} from '../src/project/model.js';
function button(name,caption,left=300,top=300){const c=createControl('CommandButton',name,left,top);c.properties.Caption=caption;return c;}
function label(name,caption,left=300,top=1200){const c=createControl('Label',name,left,top);c.properties.Caption=caption;c.properties.Width=4500;return c;}
const modal=newProject('ModalTests'),main=modal.modules[0],dialog=createForm('Dialog1','Modal dialog');
main.form.controls=[button('cmdShow','Show dialog'),label('lblState','idle')];
main.code=`Option Explicit
Private Sub cmdShow_Click()
 lblState.Caption = "before"
 Dialog1.Show vbModal
 lblState.Caption = "after"
End Sub`;
dialog.form.properties.ClientWidth=4500;dialog.form.properties.ClientHeight=1800;
dialog.form.controls=[button('cmdOK','Close dialog')];dialog.code=`Option Explicit
Private Sub cmdOK_Click()
 Unload Me
End Sub`;
modal.modules.push(dialog);
const debug=newProject('DebugTests'),d=debug.modules[0];d.form.controls=[label('lblState','idle')];
d.code=`Option Explicit
Private Sub Form_Load()
 Dim n As Long
 n = 7
 n = n + 2
 lblState.Caption = CStr(n)
End Sub`;
const timer=newProject('TimerTests'),t=timer.modules[0],clock=createControl('Timer','Timer1');clock.properties.Interval=40;clock.properties.Enabled=-1;
t.form.controls=[clock,button('cmdPause','Pause'),label('lblTicks','0')];t.code=`Option Explicit
Private ticks As Long
Private Sub Timer1_Timer()
 ticks = ticks + 1
 lblTicks.Caption = CStr(ticks)
End Sub
Private Sub cmdPause_Click()
 Timer1.Enabled = False
End Sub`;
const cancel=newProject('DoEventsTests'),f=cancel.modules[0];f.form.controls=[button('cmdStart','Start'),button('cmdCancel','Cancel',2200),label('lblState','idle')];f.code=`Option Explicit
Private cancelled As Boolean
Private Sub cmdStart_Click()
 Dim n As Long
 cancelled = False
 lblState.Caption = "busy"
 Do While Not cancelled
  n = n + 1
  DoEvents
 Loop
 lblState.Caption = "cancelled"
End Sub
Private Sub cmdCancel_Click()
 cancelled = True
End Sub`;
const controls=newProject('AllControls'),types=[...BASIC_CONTROL_TYPES.filter(t=>!['Pointer','OLE'].includes(t)),...EXTENDED_CONTROL_TYPES];
controls.modules[0].form.properties.ClientWidth=18000;controls.modules[0].form.properties.ClientHeight=18000;
controls.modules[0].form.controls=types.map((type,i)=>{const c=createControl(type,'c'+type,(i%5)*3450,Math.floor(i/5)*1900);c.properties.Width=Math.min(c.properties.Width,3300);c.properties.Height=Math.min(c.properties.Height,1800);return c;});
const injection=newProject('InjectionTest');injection.modules[0].code='Private Sub Form_Load()\n Debug.Print "</script><script>globalThis.injected = 1</script>"\nEnd Sub';
process.stdout.write(JSON.stringify({modal,debug,timer,cancel,controls,injection,types}));
