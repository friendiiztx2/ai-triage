const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'users', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `{saving ? 'บันทึก...' : 'บันทึ                                {/* Compact Form Input Stack */}`;

const replacementStr = `{saving ? 'บันทึก...' : 'บันทึก'}
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* ================= REDESIGNED INLINE COLLAPSIBLE FORM (PATCH) ================= */}
                      {isPatchActive && (
                        <tr className="bg-slate-50/50 dark:bg-slate-900/10 border-b border-slate-200 dark:border-slate-800 animate-fadeIn">
                          <td colSpan={7} className="px-6 py-5">
                            <div className="max-w-xl mx-auto bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
                              <form onSubmit={handleEditUser} className="space-y-4 text-left select-none">
                                
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-955/20 text-indigo-600 dark:text-indigo-400">
                                      <Shield size={16} />
                                    </div>
                                    <div>
                                      <h4 className="font-extrabold text-slate-850 dark:text-slate-200 text-xs">แก้ไขข้อมูลพนักงาน</h4>
                                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">แก้ไขข้อมูลของ: {u.name} ({u.email})</p>
                                    </div>
                                  </div>
                                  <button 
                                    type="button" 
                                    onClick={() => setExpandedPatchUserId(null)}
                                    className="p-1 text-slate-400 hover:text-slate-600 transition"
                                  >
                                    <X size={15} />
                                  </button>
                                </div>

                                {error && (
                                  <div className="bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-455 text-[10px] font-bold p-3 rounded-xl border border-rose-200/50 dark:border-rose-900/30">
                                    ⚠️ {error}
                                  </div>
                                )}

                                {/* Compact Form Input Stack */}`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully restored users form structure!');
} else {
  console.log('Target string not found. Checking alternate match...');
  // Check if we can find it with less trailing space
  const lines = content.split('\n');
  const targetIndex = lines.findIndex(l => l.includes("saving ? 'บันทึก...' : 'บันทึ"));
  if (targetIndex !== -1) {
    lines[targetIndex] = replacementStr;
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log('Successfully restored users form structure via line match!');
  } else {
    console.log('Could not find any match.');
  }
}
