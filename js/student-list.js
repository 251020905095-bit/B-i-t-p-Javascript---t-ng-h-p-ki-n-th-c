import { formatCurrency } from "./grade-calculator.js";

function formatScore(score) {
    return Number(score).toFixed(2);
}

function getClassificationClass(classification) {
    switch (classification) {
        case "Giỏi":
            return "classification gioi";
        case "Khá":
            return "classification kha";
        case "Trung bình":
            return "classification tb";
        default:
            return "classification yeu";
    }
}

function getTierBadgeClass(group) {
    if (group === "Top 10%") return "tier-badge tier-1";
    if (group === "Top 11% – 30%") return "tier-badge tier-2";
    if (group === "Top 31% – 50%") return "tier-badge tier-3";
    return "tier-badge";
}

export function compareVietnameseNames(nameA, nameB) {
    const partsA = nameA.trim().split(/\s+/);
    const partsB = nameB.trim().split(/\s+/);

    const givenA = partsA[partsA.length - 1] || "";
    const givenB = partsB[partsB.length - 1] || "";

    const givenCmp = givenA.localeCompare(givenB, "vi", { sensitivity: "base" });
    if (givenCmp !== 0) {
        return givenCmp;
    }

    const prefixA = partsA.slice(0, -1).join(" ");
    const prefixB = partsB.slice(0, -1).join(" ");
    const prefixCmp = prefixA.localeCompare(prefixB, "vi", { sensitivity: "base" });
    if (prefixCmp !== 0) {
        return prefixCmp;
    }

    return nameA.localeCompare(nameB, "vi", { sensitivity: "base" });
}

export function renderStudentList(
    students,
    subjects,
    enrichedById,
    options = { sortByName: false }
) {
    const tableHead = document.getElementById("tableHead");
    const tableBody = document.getElementById("studentTableBody");

    tableHead.innerHTML = `
    <tr>
        <th>Mã SV</th>
        <th class="text-left">Họ và tên</th>
        ${subjects.map(subject => `<th>${subject.name}</th>`).join("")}
        <th>Điểm TB</th>
        <th>Xếp loại</th>
        <th>Hạng</th>
        <th>Nhóm HB</th>
        <th>Học bổng</th>
        <th>Thao tác</th>
    </tr>
    `;

    const displayStudents = options.sortByName
        ? [...students].sort((a, b) => compareVietnameseNames(a.name, b.name))
        : students;

    tableBody.innerHTML = displayStudents.map(student => {
        const entry = enrichedById.get(student.id);

        if (!entry || !entry.hasGrade) {
            return `
                <tr>
                    <td>${student.id}</td>
                    <td class="student-name">${student.name}</td>
                    <td colspan="${subjects.length + 7}">Chưa có dữ liệu điểm</td>
                </tr>
            `;
        }

        const { result } = entry;

        return `
            <tr>
                <td><strong>${student.id}</strong></td>
                <td class="student-name">${student.name}</td>
                ${result.subjectResults.map(item => `
                    <td class="${item.average < 5 ? "failed-score" : ""}">${formatScore(item.average)}</td>
                `).join("")}
                <td class="average-score">${formatScore(result.average)}</td>
                <td>
                    <span class="${getClassificationClass(result.classification)}">
                        ${result.classification}
                    </span>
                </td>
                <td>
                    <span class="rank-text ${result.rank <= 3 ? "top-rank" : ""}">#${result.rank}</span>
                </td>
                <td>
                    <span class="${getTierBadgeClass(result.scholarshipGroup)}">${result.scholarshipGroup}</span>
                </td>
                <td class="${result.scholarship > 0 ? "scholarship-amount" : "scholarship-zero"}">
                    ${formatCurrency(result.scholarship)}
                </td>
                <td>
                    <button type="button" class="detail-button" data-student-id="${student.id}">
                        Xem / Sửa
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    const activeEntries = displayStudents
        .map(student => enrichedById.get(student.id))
        .filter(entry => entry && entry.hasGrade);

    document.getElementById("totalStudents").textContent = displayStudents.length;

    const classAverage = activeEntries.length
        ? activeEntries.reduce((sum, entry) => sum + entry.result.average, 0) / activeEntries.length
        : 0;

    document.getElementById("classAverage").textContent = classAverage.toFixed(2);

    document.getElementById("scholarshipCount").textContent =
        activeEntries.filter(entry => entry.result.scholarship > 0).length;

    const failedCountEl = document.getElementById("failedSubjectStudentCount");
    if (failedCountEl) {
        failedCountEl.textContent = activeEntries.filter(
            entry => entry.result.hasFailedSubject
        ).length;
    }

    const sortNote = options.sortByName ? " · Đang xếp theo tên tiếng Việt (A → Z)" : "";
    document.getElementById("resultCount").textContent =
        `Hiển thị ${displayStudents.length} sinh viên${sortNote}`;
}
