export function renderStatistics(students, subjects, enrichedById) {
    const activeEntries = students
        .map(student => enrichedById.get(student.id))
        .filter(entry => entry && entry.hasGrade);

    const topStudentsBox = document.getElementById("topStudentsBox");
    if (activeEntries.length === 0) {
        topStudentsBox.innerHTML = "<p>Chưa có dữ liệu điểm sinh viên.</p>";
    } else {
        const maxAvg = Math.max(...activeEntries.map(e => e.result.average));
        const topEntries = activeEntries.filter(
            e => Math.abs(e.result.average - maxAvg) < 1e-12
        );

        topStudentsBox.innerHTML = topEntries
            .map(e => `
                <div class="top-student-highlight">
                    <strong>${e.student.name}</strong> (${e.student.id})
                    <span class="class-badge">${e.student.class}</span>
                    <div class="top-student-sub">
                        Điểm trung bình học kỳ: <strong>${e.result.average.toFixed(2)}</strong> ·
                        Xếp loại: <strong>${e.result.classification}</strong>
                    </div>
                </div>
            `)
            .join("");
    }

    const classifications = ["Giỏi", "Khá", "Trung bình", "Yếu"];
    const totalActive = activeEntries.length;
    const classStatsBody = document.getElementById("classificationStatsBody");

    classStatsBody.innerHTML = classifications
        .map(label => {
            const count = activeEntries.filter(e => e.result.classification === label).length;
            const percent = totalActive > 0 ? ((count / totalActive) * 100).toFixed(1) : "0.0";
            return `
                <tr>
                    <td class="text-left"><strong>${label}</strong></td>
                    <td>${count}</td>
                    <td>${percent}%</td>
                </tr>
            `;
        })
        .join("");

    const belowFiveBody = document.getElementById("belowFiveBody");
    const studentsBelowFive = activeEntries.filter(e => e.result.hasFailedSubject);

    if (studentsBelowFive.length === 0) {
        belowFiveBody.innerHTML = `
            <tr>
                <td colspan="4">Không có sinh viên nào có môn dưới 5.</td>
            </tr>
        `;
    } else {
        belowFiveBody.innerHTML = studentsBelowFive
            .map(e => {
                const failedText = e.result.failedSubjects
                    .map(sub => `${sub.subjectName} (${sub.average.toFixed(2)})`)
                    .join(", ");
                return `
                    <tr>
                        <td><strong>${e.student.id}</strong></td>
                        <td class="student-name">${e.student.name}</td>
                        <td class="average-score">${e.result.average.toFixed(2)}</td>
                        <td class="text-left failed-score">${failedText}</td>
                    </tr>
                `;
            })
            .join("");
    }

    const subjectStatsBody = document.getElementById("subjectStatsBody");
    subjectStatsBody.innerHTML = subjects
        .map(subject => {
            const averages = activeEntries
                .map(e => {
                    const found = e.result.subjectResults.find(s => s.subjectId === subject.id);
                    return found ? found.average : null;
                })
                .filter(val => val !== null);

            if (averages.length === 0) {
                return `
                    <tr>
                        <td class="text-left">${subject.name}</td>
                        <td colspan="3">Chưa có dữ liệu</td>
                    </tr>
                `;
            }

            const avg = averages.reduce((sum, v) => sum + v, 0) / averages.length;
            const minVal = Math.min(...averages);
            const maxVal = Math.max(...averages);

            return `
                <tr>
                    <td class="text-left"><strong>${subject.name}</strong></td>
                    <td class="average-score">${avg.toFixed(2)}</td>
                    <td>${minVal.toFixed(2)}</td>
                    <td>${maxVal.toFixed(2)}</td>
                </tr>
            `;
        })
        .join("");
}
