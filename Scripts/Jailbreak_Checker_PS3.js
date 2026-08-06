    <script>
        // ---- Helper functions (trim, parse, etc.) ----
        function trimStr(str) { return str.replace(/^\s+|\s+$/g, ''); }

        function parseFullDate(dateStr) {
            var s = trimStr(dateStr);
            var parts = s.split(/\s+/);
            if (parts.length < 2) return null;
            var monthName = parts[0].toLowerCase();
            var yearPart = parts[1];
            var year = parseInt(yearPart, 10);
            if (isNaN(year) || year < 2009 || year > 2013) return null;
            var months = { 
                january:1, february:2, march:3, april:4, may:5, june:6,
                july:7, august:8, september:9, october:10, november:11, december:12,
                jan:1, feb:2, mar:3, apr:4, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 
            };
            var monthNum = months[monthName];
            if (monthNum === undefined) return null;
            return { yearDigit: year - 2010, month: monthNum, year: year };
        }

        function getModelPrefix(cleaned) {
            if (/^CECH[A-HJ-MP-Q]/.test(cleaned)) return cleaned.substring(0,5);
            var match = cleaned.match(/^CECH(\d\d)/);
            if (match) return 'CECH-' + match[1];
            return cleaned;
        }

        // ---- Core checker functions ----
        function getPS3Model(model) {
            if (!model || model === '?') return '?';
            var cleaned = '';
            for (var i = 0; i < model.length; i++) {
                var ch = model.charAt(i);
                if ((ch >= '0' && ch <= '9') || (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z')) cleaned += ch;
            }
            var m = cleaned.toUpperCase();
            if (/^DECR/.test(m)) return 'Reference Tool';
            if (/^DECHS/.test(m)) return 'Debug Station';
            if (/^DECH/.test(m)) return 'Debug Station';
            if (/^CEB/.test(m)) return 'Prototype';
            if (m.indexOf('CECHA') === 0 || m.indexOf('CECHB') === 0 || m.indexOf('CECHC') === 0 ||
                m.indexOf('CECHE') === 0 || m.indexOf('CECHG') === 0 || m.indexOf('CECHH') === 0 ||
                m.indexOf('CECHJ') === 0 || m.indexOf('CECHK') === 0 || m.indexOf('CECHL') === 0 ||
                m.indexOf('CECHM') === 0 || m.indexOf('CECHP') === 0 || m.indexOf('CECHQ') === 0) return 'Fat';
            if (m.indexOf('CECH4') === 0) return 'Super Slim';
            if (m.indexOf('CECH2') === 0 || m.indexOf('CECH3') === 0) return 'Slim';
            return 'Unknown';
        }

        function getFlashType(model) {
            if (!model || model === '?') return 'Unknown';
            var m = model.toUpperCase();
            if (m.indexOf('CECHA') === 0 || m.indexOf('CECHB') === 0 ||
                m.indexOf('CECHC') === 0 || m.indexOf('CECHE') === 0 ||
                m.indexOf('CECHG') === 0) return 'NAND';
            if (/^DECR-?1000/.test(m)) return 'NAND';
            if (/^DECH-?A00/.test(m) || /^DECH-?J00/.test(m) || /^DECHSJ00/.test(m)) return 'NAND';
            if ((/^CECH-?42\d{2}[A-Za-z]?$/).test(m) || (/^CECH-?43\d{2}[A-Za-z]?$/).test(m)) return 'eMMC';
            if (/^DECH-?4000/.test(m) || /^DECH-?40\d{2}[A-Za-z]?$/.test(m)) return 'eMMC';
            return 'NOR';
        }

        function getBackwardsCompatibility(type, model, boolean) {
            var m = model.toUpperCase();
            if (m.indexOf('CECHA') === 0 || m.indexOf('CECHB') === 0) return "Full PS2 Hardware (EE+GS)";
            if (m.indexOf('CECHC') === 0 || m.indexOf('CECHE') === 0) return "Partial PS2 (GS only)";
            if (m.indexOf('DECR') === 0) return "No (No PS2 hardware or emulator)";
            if (m.indexOf('CEB') === 0) return "No (Development Prototype, no PS2 hardware or PS2 emulation)";
            if (m.indexOf('DECH') === 0) {
                if (m.indexOf('DECH25') === 0 || m.indexOf('DECH-25') === 0 || m.indexOf('DECHS25') === 0)
                    return boolean === true ? (type == "OFW" ? "No" : "Yes Through Emulation") : "OFW: No, If Jailbroken Yes Through Emulation";
                if (m.indexOf('DECH30') === 0 || m.indexOf('DECH-30') === 0 || m.indexOf('DECH40') === 0 || m.indexOf('DECH-40') === 0)
                    return boolean === true ? (type == "OFW" ? "No" : "Yes Through Emulation") : "OFW: No, If Jailbroken Yes Through Emulation";
                return "Full PS2 Hardware (EE+GS)";
            }
            return boolean === true ? (type == "OFW" ? "No" : "Yes Through Emulation") : "OFW: No, If Jailbroken Yes Through Emulation";
        }

        function getMaxDowngradeFirmware(model, date_code, manufacturing_date, month, year) {
            if (!model) return null;
            var isOldStyle = (typeof date_code === 'number' || date_code === undefined) && (typeof manufacturing_date === 'number' || manufacturing_date === undefined);
            var yr = 0, mo = 0, hasDate = false;
            if (isOldStyle) {
                var m = (typeof date_code === 'number') ? date_code : 0;
                var y = (typeof manufacturing_date === 'number') ? manufacturing_date : 0;
                if (m>0 && y>0) { mo=m; yr=y; hasDate=true; }
            } else {
                if (manufacturing_date && manufacturing_date.trim && manufacturing_date.trim()!=='') {
                    var man = manufacturing_date.trim(), parts = man.split(/\s+/);
                    if (parts.length>=2) {
                        var monthNames = ["january","february","march","april","may","june","july","august","september","october","november","december"];
                        var monthLower = parts[0].toLowerCase();
                        for (var i=0; i<monthNames.length; i++) {
                            if (monthNames[i].indexOf(monthLower)===0 || monthLower===monthNames[i]) { mo=i+1; break; }
                        }
                        var yrNum = parseInt(parts[1],10);
                        if (!isNaN(yrNum) && yrNum>=2009 && yrNum<=2013) { yr=yrNum; hasDate=true; }
                    }
                }
                if (!hasDate && date_code && date_code.trim && date_code.trim()!=='') {
                    var dc = date_code.trim().toUpperCase();
                    if (dc.length>=2) {
                        var yd = dc.charCodeAt(0)-48, qc = dc.charAt(1), quarter = qc.charCodeAt(0)-64;
                        if (!isNaN(yd) && quarter>=1 && quarter<=4) { yr=yd+2010; mo=(quarter-1)*3+1; hasDate=true; }
                    }
                }
                if (!hasDate && typeof month === 'number' && typeof year === 'number') {
                    if (month>=1 && month<=12 && year>=2009 && year<=2013) { mo=month; yr=year; hasDate=true; }
                }
            }
            var cleaned = model.toUpperCase().replace(/[-\s]/g,''), prefix='';
            if (cleaned.indexOf('DECR')===0) prefix='DECR';
            else if (cleaned.indexOf('DECH')===0) {
                var numMatch = cleaned.match(/^DECH(\d{2})/);
                if (numMatch) prefix = 'DECH-' + numMatch[1];
                else prefix = 'DECH';
            } else if (cleaned.indexOf('CEB')===0) prefix='CEB';
            else {
                var fatLetterMatch = cleaned.match(/^CECH([A-Z])/);
                if (fatLetterMatch) prefix = 'CECH' + fatLetterMatch[1];
                else { var nMatch = cleaned.match(/^CECH(\d{2})/); if (nMatch) prefix = 'CECH-' + nMatch[1]; }
            }
            if (!prefix) return null;
            if (prefix === 'DECR') {
                if (cleaned.indexOf('DECR-1000')!==-1) return "0.85";
                if (cleaned.indexOf('DECR-1400')!==-1) return "2.60";
                if (cleaned.indexOf('DECR-1500')!==-1) return "3.56+ (Likely >3.56, verify with MinVerChk)";
                if (cleaned.indexOf('DECR-1600')!==-1) return "4.11+ (Likely >4.10, verify with MinVerChk)";
                return "Unknown (Dev Kit)";
            }
            if (prefix === 'CEB') return "Unknown (Early Prototype)";
            if (prefix === 'DECH') return "1.00";
            if (prefix === 'DECH-20') return "2.70";
            if (prefix === 'DECH-21') return "3.20";
            if (prefix === 'DECH-25') {
                if (!hasDate) return "3.40–3.60+ (requires date code or manufacturing date)";
                if (yr < 2010 || (yr===2010 && mo<7)) return "N/A (model not yet manufactured)";
                if (yr===2010) { if (mo>=7 && mo<=9) return "3.40"; if (mo>=10 && mo<=12) return "3.40 or 3.50"; }
                if (yr===2011) {
                    if (mo>=1 && mo<=3) return "3.60+ (some 3.50-3.56)";
                    if (mo>=4 && mo<=6) return "3.60+ or 3.56 (Rare!)";
                    if (mo>=7) return "N/A (production ended)";
                }
                if (yr>=2012) return "N/A (production ended)";
                return "3.40–3.60+ (requires date code)";
            }
            if (prefix === 'DECH-30') return "3.60+";
            if (prefix === 'DECH-40') return "4.11–4.31";
            if (prefix === 'CECHA' || prefix === 'CECHB') return "1.00";
            if (prefix === 'CECHC') return "1.00";
            if (prefix === 'CECHE') return "1.00";
            if (prefix === 'CECHG') return "1.90";
            if (prefix === 'CECHH') return "1.97";
            if (prefix === 'CECHJ') return "2.16";
            if (prefix === 'CECHK' || prefix === 'CECHL' || prefix === 'CECHM' || prefix === 'CECHP' || prefix === 'CECHQ') return "2.45";
            if (prefix === 'CECH-20') return "2.70";
            if (prefix === 'CECH-21') return "3.20";
            if (prefix === 'CECH-25') {
                if (!hasDate) return "3.40–3.60+ (requires date code or manufacturing date)";
                if (yr < 2010 || (yr===2010 && mo<7)) return "N/A (model not yet manufactured)";
                if (yr===2010) { if (mo>=7 && mo<=9) return "3.40"; if (mo>=10 && mo<=12) return "3.40 or 3.50"; }
                if (yr===2011) {
                    if (mo>=1 && mo<=3) return "3.60+ (some 3.50-3.56)";
                    if (mo>=4 && mo<=6) return "3.60+ or 3.56 (Rare!)";
                    if (mo>=7) return "N/A (production ended)";
                }
                if (yr>=2012) return "N/A (production ended)";
                return "3.40–3.60+ (requires date code)";
            }
            if (prefix === 'CECH-30') return "3.60+";
            if (prefix === 'CECH-40') return "4.11–4.31";
            if (prefix === 'CECH-42') return "4.40";
            if (prefix === 'CECH-43') return "4.50";
            return null;
        }

        function checkCFWCompatibility(model, datecode) {
            var cleaned = model.toUpperCase().replace(/\s/g, '').replace(/-/g, '');
            if (cleaned.indexOf('CECH') !== 0 && cleaned.indexOf('DECH') !== 0 && cleaned.indexOf('DECR') !== 0 && cleaned.indexOf('CEB') !== 0)
                cleaned = 'CECH' + cleaned;
            var isDevKit = (cleaned.indexOf('DECR') === 0 || cleaned.indexOf('DECH') === 0 || cleaned.indexOf('DECHS') === 0 || cleaned.indexOf('CEB') === 0);
            var cfw = '', maxDowngradeFirmware = null, prefix = getModelPrefix(cleaned);
            if (prefix) {
                var yr = 0, mo = 0;
                if (datecode) {
                    var pd = parseFullDate(datecode);
                    if (pd) { yr = pd.year; mo = pd.month; }
                    else {
                        var dc = trimStr(datecode.toUpperCase());
                        if (dc.length >= 2) {
                            var yd = dc.charCodeAt(0)-48, qc = dc.charAt(1), quarter = qc.charCodeAt(0)-64;
                            if (!isNaN(yd) && quarter>=1 && quarter<=4) { yr = yd+2010; mo = (quarter-1)*3+1; }
                        }
                    }
                }
                maxDowngradeFirmware = getMaxDowngradeFirmware(prefix, mo, yr);
            }
            function getDateInfo(dc) {
                if (!dc) return null;
                var parsed = parseFullDate(dc);
                if (parsed) return { year: parsed.year, month: parsed.month, isManufactureDate: true };
                var dcu = trimStr(dc.toUpperCase());
                if (dcu.length>=2) {
                    var yd = dcu.charCodeAt(0)-48, qc = dcu.charAt(1), quarter = qc.charCodeAt(0)-64;
                    if (!isNaN(yd) && quarter>=1 && quarter<=4) return { year: yd+2010, month: (quarter-1)*3+1, isManufactureDate: false };
                }
                return null;
            }
            if (isDevKit) {
                if (cleaned.indexOf('DECR')===0) cfw = 'Yes';
                else if (cleaned.indexOf('CEB')===0) cfw = 'Yes';
                else {
                    if (cleaned.indexOf('DECH25')===0 || cleaned.indexOf('DECH-25')===0 || cleaned.indexOf('DECHS25')===0) {
                        if (!datecode) return 'NEED_DATE';
                        var dinfo = getDateInfo(datecode);
                        if (!dinfo) return 'Invalid date code';
                        var year = dinfo.year, month = dinfo.month, label = dinfo.isManufactureDate ? 'manufacturing date' : 'date code';
                        if (year<=2010) cfw = 'Yes (DECH-25xx, ' + label + ' ' + datecode + ' - min firmware < 3.60)';
                        else if (year===2011) {
                            if (month>=1 && month<=3) cfw = 'Maybe - Manual check required (minimum firmware version must be < 3.60)';
                            else if (month>=4 && month<=6) cfw = 'Maybe (Very Unlikely & Rare) - Manual check required (minimum firmware version must be < 3.60)';
                            else cfw = 'No (DECH-25xx, ' + label + ' ' + datecode + ' - production ended)';
                        } else cfw = 'No (DECH-25xx, ' + label + ' ' + datecode + ' - min firmware > 3.56)';
                    }
                    else if (cleaned.indexOf('DECH30')===0 || cleaned.indexOf('DECH-30')===0 || cleaned.indexOf('DECH40')===0 || cleaned.indexOf('DECH-40')===0) cfw = 'No';
                    else cfw = 'Yes';
                }
            } else {
                if (cleaned.indexOf('CECHA')===0 || cleaned.indexOf('CECHB')===0 || cleaned.indexOf('CECHC')===0 || cleaned.indexOf('CECHE')===0 ||
                    cleaned.indexOf('CECHG')===0 || cleaned.indexOf('CECHH')===0 || cleaned.indexOf('CECHJ')===0 || cleaned.indexOf('CECHK')===0 ||
                    cleaned.indexOf('CECHL')===0 || cleaned.indexOf('CECHM')===0 || cleaned.indexOf('CECHP')===0 || cleaned.indexOf('CECHQ')===0) cfw = 'Yes';
                else if (cleaned.indexOf('CECH20')===0 || cleaned.indexOf('CECH-20')===0 || cleaned.indexOf('CECH21')===0 || cleaned.indexOf('CECH-21')===0) cfw = 'Yes';
                else if (cleaned.indexOf('CECH25')===0 || cleaned.indexOf('CECH-25')===0) {
                    if (!datecode) return 'NEED_DATE';
                    var dinfo = getDateInfo(datecode);
                    if (!dinfo) return 'Invalid date code';
                    var year = dinfo.year, month = dinfo.month, label = dinfo.isManufactureDate ? 'manufacturing date' : 'date code';
                    if (year<=2010) cfw = 'Yes (CECH-25xx, ' + label + ' ' + datecode + ' - min firmware < 3.60)';
                    else if (year===2011) {
                        if (month>=1 && month<=3) cfw = 'Maybe - Manual check required (minimum firmware version must be < 3.60)';
                        else if (month>=4 && month<=6) cfw = 'Maybe (Very Unlikely & Rare) - Manual check required (minimum firmware version must be < 3.60)';
                        else cfw = 'No (CECH-25xx, ' + label + ' ' + datecode + ' - production ended)';
                    } else cfw = 'No (CECH-25xx, ' + label + ' ' + datecode + ' - min firmware > 3.56)';
                }
                else if (cleaned.indexOf('CECH30')===0 || cleaned.indexOf('CECH-30')===0 ||
                         cleaned.indexOf('CECH40')===0 || cleaned.indexOf('CECH-40')===0 ||
                         cleaned.indexOf('CECH42')===0 || cleaned.indexOf('CECH-42')===0 ||
                         cleaned.indexOf('CECH43')===0 || cleaned.indexOf('CECH-43')===0) cfw = 'No';
                else return 'Unknown model';
            }
            var flash = getFlashType(cleaned);
            var qcfw = (flash === 'NOR') ? 'Yes (requires soldering)' : 'No';
            var modelType = getPS3Model(cleaned);
            var displayModel = cleaned;
            if (displayModel.indexOf('CECH')===0 && displayModel.length>5 && displayModel.charAt(4)>='0' && displayModel.charAt(4)<='9')
                displayModel = 'CECH-' + displayModel.substring(4);
            return { cfw: cfw, qcfw: qcfw, flash: flash, modelType: modelType, displayModel: displayModel, isDevKit: isDevKit, maxDowngradeFirmware: maxDowngradeFirmware };
        }

        // ---- UI triggers ----
        function runChecker(datecode) {
            if (typeof checkCFWCompatibility !== 'function') { 
                document.getElementById('cfwResult').innerHTML = 'Script not loaded correctly.'; 
                return; 
            }
            var resultDiv = document.getElementById('cfwResult');
            var modelInput = document.getElementById('modelInput');
            var model = modelInput ? modelInput.value : '';
            model = trimStr(model);
            if (!model) { 
                resultDiv.innerHTML = '<span style="color:#ffa500;">Please enter a model number.</span>'; 
                return; 
            }
            var cleaned = model.toUpperCase().replace(/\s/g,'').replace(/-/g,'');
            if (!/^CECH/.test(cleaned) && !/^DECH/.test(cleaned) && !/^DECR/.test(cleaned) && !/^CEB/.test(cleaned)) 
                cleaned = 'CECH' + cleaned;
            var res = checkCFWCompatibility(model, datecode);
            if (res === 'NEED_DATE') { 
                document.getElementById('datecode-box').style.display = 'block'; 
                resultDiv.innerHTML = ''; 
                return; 
            }
            if (res === 'Unknown model') { 
                resultDiv.innerHTML = '<span style="color:#ffa500;">Unknown model - please check the number (e.g., 2501A).</span>'; 
                return; 
            }
            if (res === 'Invalid date code') { 
                resultDiv.innerHTML = '<span style="color:#ffa500;">Invalid date code. Please check the back sticker (e.g., 0C or January 2010).</span>'; 
                return; 
            }
            var cfw = res.cfw, qcfw = res.qcfw, flash = res.flash, modelType = res.modelType, displayModel = res.displayModel, isDevKit = res.isDevKit, maxDowngradeFirmware = res.maxDowngradeFirmware;
            var cfwColor = '#28a745'; 
            if (cfw.indexOf('Maybe')===0) cfwColor='#ffa500'; 
            if (cfw.indexOf('No')===0) cfwColor='#dc3545';
            var qcfwColor = (qcfw.indexOf('No')===0) ? '#dc3545' : '#28a745';
            var html = '';
            html += '<span style="color:'+cfwColor+';">CFW: ' + cfw + '</span><br>';
            html += '<span style="color:'+qcfwColor+';">qCFW: ' + qcfw + '</span><br>';
            html += '<span style="color:#28a745;">HEN: Yes</span><br><br>';
            html += 'Model Number: '+displayModel+'<br>';
            html += 'Model: '+modelType+'<br>';
            html += 'Flash Memory Type: '+flash+'<br>';
            html += 'PS2 Backwards Compatibility: '+getBackwardsCompatibility(null, cleaned, false)+'<br>';
            if (maxDowngradeFirmware) html += 'Estimated Minimum Applicable Firmware Version: ' + maxDowngradeFirmware + ' (Also Known As: Max Downgrade Version, Factory Firmware)' + '<br>';
            if (isDevKit) html += '<span style="color:#f79452;">Info: Jailbreaking a Dev Kit PS3 is not recommended!</span><br>';
            resultDiv.innerHTML = html;
            document.getElementById('datecode-box').style.display = 'none';
            if (/^CECH-?25/.test(cleaned) || /^DECH-?25/.test(cleaned)) document.getElementById('datecode-box').style.display = 'block';
        }

        function verifyDateCode() {
            var monthSelect = document.getElementById('monthSelect'), yearSelect = document.getElementById('yearSelect');
            if (monthSelect && yearSelect && monthSelect.value !== '' && yearSelect.value !== '') {
                var monthNum = parseInt(monthSelect.value,10), yearNum = parseInt(yearSelect.value,10);
                var monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
                var monthName = monthNames[monthNum-1];
                runChecker(monthName + " " + yearNum);
                return;
            }
            var dcInput = document.getElementById('datecodeInput');
            var dc = dcInput ? dcInput.value : '';
            dc = trimStr(dc);
            if (!dc) { 
                document.getElementById('cfwResult').innerHTML = '<span style="color:#ffa500;">Please enter a date code or select a manufacturing date.</span>'; 
                return; 
            }
            runChecker(dc);
        }

        // ---- Zoom functions ----
        function zoomImage(src) {
            var overlay = document.getElementById('image-overlay');
            var img = document.getElementById('zoom-img');
            if (overlay && img) {
                img.src = src;
                overlay.style.display = 'block';
            }
        }
        function closeZoom() {
            var overlay = document.getElementById('image-overlay');
            if (overlay) overlay.style.display = 'none';
        }
        document.addEventListener('keydown', function(e) {
            if (e.key === "Escape") closeZoom();
        });

        // ---- Keyboard support (Enter key on inputs) ----
        if (!window.isPS3) {
            var modelInput = document.getElementById('modelInput');
            if (modelInput) {
                modelInput.onkeypress = function(e) {
                    e = e || window.event;
                    if ((e.keyCode || e.which) === 13) {
                        var datecodeBox = document.getElementById('datecode-box');
                        if (datecodeBox && datecodeBox.style.display === 'block') {
                            var datecodeInput = document.getElementById('datecodeInput');
                            var monthSelect = document.getElementById('monthSelect');
                            var yearSelect = document.getElementById('yearSelect');
                            if (datecodeInput && datecodeInput.value.trim() !== '') {
                                runChecker(datecodeInput.value.trim());
                            } else if (monthSelect && yearSelect && monthSelect.value !== '' && yearSelect.value !== '') {
                                var monthNum = parseInt(monthSelect.value, 10);
                                var yearNum = parseInt(yearSelect.value, 10);
                                var monthNames = ["January","February","March","April","May","June",
                                                  "July","August","September","October","November","December"];
                                var monthName = monthNames[monthNum-1];
                                runChecker(monthName + " " + yearNum);
                            } else {
                                runChecker(null);
                            }
                        } else {
                            runChecker(null);
                        }
                        return false;
                    }
                };
            }
            var datecodeInput = document.getElementById('datecodeInput');
            if (datecodeInput) {
                datecodeInput.onkeypress = function(e) {
                    e = e || window.event;
                    if ((e.keyCode || e.which) === 13) {
                        verifyDateCode();
                        return false;
                    }
                };
            }
        }

        // ---- Page initialisation ----
        function onPageLoad() {
            var tutorialBtn = document.getElementById('tutorialBtn');
            var tutorialDiv = document.getElementById('manualTutorial');
            if (tutorialBtn && tutorialDiv) {
                tutorialBtn.onclick = function() {
                    if (tutorialDiv.style.display === 'none') {
                        tutorialDiv.style.display = 'block';
                        tutorialBtn.textContent = 'Hide Manual Check Tutorial';
                    } else {
                        tutorialDiv.style.display = 'none';
                        tutorialBtn.textContent = 'Show Manual Check Tutorial';
                    }
                };
            }
        }

        // Attach load event
        if (window.addEventListener) {
            window.addEventListener('load', onPageLoad, false);
        } else if (window.attachEvent) {
            window.attachEvent('onload', onPageLoad);
        } else {
            window.onload = function() { onPageLoad(); };
        }
    </script>
