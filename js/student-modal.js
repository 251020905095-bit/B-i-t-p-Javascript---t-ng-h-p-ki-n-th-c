import { formatCurrency } from "./grade-calculator.js";

export function setupStudentModal(state, getEnrichedMap, refreshAll, showAlert) {
    const modal = document.getElementById("studentModal");
    const detail = document.getElementById("studentDetail");
    const tableBody = document.getElementById("studentTableBody");

    function closeEditModal() {
        modal.hidden = true;
        state.editingStudentId = null;
    }

    function openEditModal(studentId) {
        const student = state.students.find(item => item.id === studentId);
        let gradeObj = state.grades.find(g => g.student_id === studentId);
        if (!gradeObj) {
            gradeObj = { student_id: studentId, scores: {} };
            state.grades.push(gradeObj);
        }

        const enrichedMap = getEnrichedMap();
        const entry = enrichedMap.get(studentId);
        const result = entry ? entry.result : null;
        if (!result) return;

        state.editingStudentId = studentId;

        detail.innerHTML = `
            <div class="student-info">
                <p><strong>Mã sinh viên:</strong> ${student.id}</p>
                <p><strong>Họ và tên:</strong> ${student.name}</p>
                <p><strong>Lớp:</strong> ${student.class}</p>
                <p><strong>Email:</strong> ${student.email}</p>
            </div>

            <h3>Chi tiết &amp; Chỉnh sửa điểm các môn (Thang điểm 0 – 10)</h3>

            <form id="editScoresForm">
                <div class="table-wrapper">
                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th class="text-left">Môn học</th>
                                <th>Chuyên cần (0.1)</th>
                                <th>Giữa kỳ (0.4)</th>
                                <th>Cuối kỳ (0.5)</th>
                                <th>Điểm TB môn</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${result.subjectResults.map(item => `
                            <tr>
                                <td class="text-left">${item.subjectName}</td>
                                <td>
                                    <input type="number" class="score-input" step="0.1" min="0" max="10"
                                        data-sub="${item.subjectId}" data-idx="0"
                                        value="${item.scores[0]}" required>
                                </td>
                                <td>
                                    <input type="number" class="score-input" step="0.1" min="0" max="10"
                                        data-sub="${item.subjectId}" data-idx="1"
                                        value="${item.scores[1]}" required>
                                </td>
                                <td>
                                    <input type="number" class="score-input" step="0.1" min="0" max="10"
                                        data-sub="${item.subjectId}" data-idx="2"
                                        value="${item.scores[2]}" required>
                                </td>
                                <td class="${item.average < 5 ? "failed-score" : "average-score"}">
                                    ${item.average.toFixed(2)}
                                </td>
                            </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>

                <div id="errorBox" class="modal-error hidden" hidden></div>

                <div class="modal-actions">
                    <button type="button" id="cancelModalBtn" class="secondary-button">Đóng</button>
                    <button type="submit" class="primary-button">Lưu điểm &amp; Cập nhật</button>
                </div>
            </form>

            <div class="result-summary">
                <p><strong>Điểm trung bình học kỳ:</strong> ${result.average.toFixed(2)}</p>
                <p><strong>Xếp loại:</strong> ${result.classification}</p>
                <p><strong>Xếp hạng / Nhóm học bổng:</strong> #${result.rank} (${result.scholarshipGroup})</p>
                <p><strong>Học bổng:</strong> ${formatCurrency(result.scholarship)}</p>
            </div>
        `;

        modal.hidden = false;

        document.getElementById("cancelModalBtn").addEventListener("click", closeEditModal);

        const form = document.getElementById("editScoresForm");
        const errorBox = document.getElementById("errorBox");

        form.addEventListener("submit", event => {
            event.preventDefault();

            const inputs = Array.from(form.querySelectorAll(".score-input"));
            const updatedBySubject = {};

            for (const input of inputs) {
                const rawVal = input.value.trim();
                const val = Number(rawVal);

                if (rawVal === "" || Number.isNaN(val) || val < 0 || val > 10) {
                    errorBox.textContent = "Lỗi: Tất cả điểm thành phần phải là số hợp lệ từ 0 đến 10.";
                    errorBox.hidden = false;
                    errorBox.classList.remove("hidden");
                    return;
                }

                const subId = input.dataset.sub;
                const idx = Number(input.dataset.idx);
                if (!updatedBySubject[subId]) updatedBySubject[subId] = [0, 0, 0];
                updatedBySubject[subId][idx] = val;
            }

            errorBox.hidden = true;
            errorBox.classList.add("hidden");
            const gradeObj = state.grades.find(g => g.student_id === studentId);
            if (gradeObj) {
                gradeObj.scores = { ...gradeObj.scores, ...updatedBySubject };
            }

            refreshAll();
            openEditModal(studentId);
            showAlert(`Đã lưu điểm mới cho sinh viên ${studentId} và cập nhật toàn bộ điểm TB, xếp loại, học bổng và thống kê.`);
        });
    }

    tableBody.addEventListener("click", event => {
        const button = event.target.closest("[data-student-id]");
        if (!button) return;
        openEditModal(button.dataset.studentId);
    });

    document.getElementById("closeModalBtn").addEventListener("click", closeEditModal);
    document.getElementById("modalBackdrop").addEventListener("click", closeEditModal);
    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && state.editingStudentId) {
            closeEditModal();
        }
    });

    return { openEditModal, closeEditModal };
}
