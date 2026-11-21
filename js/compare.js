import { formatCurrency } from "./grade-calculator.js";

export function setupCompareSection(students, subjects, getEnrichedMap) {
    const selectStudent1 = document.getElementById("selectStudent1");
    const selectStudent2 = document.getElementById("selectStudent2");
    const meta1 = document.getElementById("compareMeta1");
    const meta2 = document.getElementById("compareMeta2");
    const header1 = document.getElementById("compareHeader1");
    const header2 = document.getElementById("compareHeader2");
    const body = document.getElementById("compareTableBody");

    function populateOptions() {
        const prev1 = selectStudent1.value;
        const prev2 = selectStudent2.value;

        const optionsHtml = students
            .map(s => `<option value="${s.id}">${s.id} - ${s.name}</option>`)
            .join("");

        selectStudent1.innerHTML = optionsHtml;
        selectStudent2.innerHTML = optionsHtml;

        if (students.length > 0) {
            selectStudent1.value = students.some(s => s.id === prev1) ? prev1 : students[0].id;
            const fallback2 = students.length > 1 ? students[1].id : students[0].id;
            selectStudent2.value = students.some(s => s.id === prev2) ? prev2 : fallback2;
        }
    }

    function renderCompareTab() {
        const enrichedMap = getEnrichedMap();
        const entry1 = enrichedMap.get(selectStudent1.value);
        const entry2 = enrichedMap.get(selectStudent2.value);

        if (!entry1 || !entry2 || !entry1.hasGrade || !entry2.hasGrade) {
            body.innerHTML = `
                <tr>
                    <td colspan="4">Vui lòng chọn hai sinh viên có dữ liệu điểm để so sánh.</td>
                </tr>
            `;
            return;
        }

        const res1 = entry1.result;
        const res2 = entry2.result;

        header1.textContent = `${entry1.student.name} (${entry1.student.id})`;
        header2.textContent = `${entry2.student.name} (${entry2.student.id})`;

        meta1.innerHTML = `Lớp: <strong>${entry1.student.class}</strong> · Xếp loại: <strong>${res1.classification}</strong> · Học bổng: <strong>${formatCurrency(res1.scholarship)}</strong>`;
        meta2.innerHTML = `Lớp: <strong>${entry2.student.class}</strong> · Xếp loại: <strong>${res2.classification}</strong> · Học bổng: <strong>${formatCurrency(res2.scholarship)}</strong>`;

        const subjectRows = subjects.map(subject => {
            const sub1 = res1.subjectResults.find(s => s.subjectId === subject.id);
            const sub2 = res2.subjectResults.find(s => s.subjectId === subject.id);
            const avg1 = sub1 ? sub1.average : 0;
            const avg2 = sub2 ? sub2.average : 0;
            const diff = avg1 - avg2;
            const sign = diff > 0 ? "+" : "";

            return `
                <tr>
                    <td class="text-left">${subject.name}</td>
                    <td>${avg1.toFixed(2)}</td>
                    <td>${avg2.toFixed(2)}</td>
                    <td class="${diff > 0 ? "average-score" : diff < 0 ? "failed-score" : ""}">${sign}${diff.toFixed(2)}</td>
                </tr>
            `;
        }).join("");

        const gpaDiff = res1.average - res2.average;
        const gpaSign = gpaDiff > 0 ? "+" : "";

        body.innerHTML = `
            ${subjectRows}
            <tr class="summary-row">
                <td class="text-left">Điểm trung bình học kỳ</td>
                <td class="average-score">${res1.average.toFixed(2)}</td>
                <td class="average-score">${res2.average.toFixed(2)}</td>
                <td class="${gpaDiff > 0 ? "average-score" : gpaDiff < 0 ? "failed-score" : ""}">${gpaSign}${gpaDiff.toFixed(2)}</td>
            </tr>
        `;
    }

    populateOptions();
    renderCompareTab();

    selectStudent1.addEventListener("change", renderCompareTab);
    selectStudent2.addEventListener("change", renderCompareTab);

    return {
        refresh: () => {
            populateOptions();
            renderCompareTab();
        }
    };
}
