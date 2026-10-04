/** A temporary keyboard move/size mode never survives blur, pointer interaction,
 * a replacement operation or owner disposal. Cancelling rolls back exactly once. */
export function keyboardTransaction(owner,{step,commit,cancel}) {
  owner.cancelInteraction?.();let ended=false;
  const finish=accepted=>{if(ended)return;ended=true;window.removeEventListener('keydown',key,true);window.removeEventListener('blur',abort);window.removeEventListener('pointerdown',abort,true);if(owner.cancelInteraction===abort)owner.cancelInteraction=null;(accepted?commit:cancel)();};
  const abort=()=>finish(false);
  const key=e=>{if(e.key==='Enter'||e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();finish(e.key==='Enter');}else{const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(d){e.preventDefault();e.stopImmediatePropagation();step(d[0]*(e.ctrlKey?1:8),d[1]*(e.ctrlKey?1:8));}}};
  owner.cancelInteraction=abort;window.addEventListener('keydown',key,true);window.addEventListener('blur',abort);window.addEventListener('pointerdown',abort,true);return abort;
}
