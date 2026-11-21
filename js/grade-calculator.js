const WEIGHTS = {
    attendance: 0.1,
    midterm: 0.4,
    final: 0.5
};

export const TOTAL_SCHOLARSHIP_FUND = 100_000_000;

export function calculateSubjectAverage(scores) {
    const [attendance = 0, midterm = 0, finalScore = 0] = scores || [];

    return (
        Number(attendance) * WEIGHTS.attendance +
        Number(midterm) * WEIGHTS.midterm +
        Number(finalScore) * WEIGHTS.final
    );
}

export function classifyAverage(average) {
    if (average >= 8.5) {
        return "Giỏi";
    }
    if (average >= 7.0) {
        return "Khá";
    }
    if (average >= 5.0) {
        return "Trung bình";
    }
    return "Yếu";
}

export function calculateStudentResult(grade, subjects) {
    const subjectResults = subjects.map(subject => {
        const rawScores = (grade && grade.scores && grade.scores[subject.id]) || [0, 0, 0];
        const scores = [
            Number(rawScores[0] ?? 0),
            Number(rawScores[1] ?? 0),
            Number(rawScores[2] ?? 0)
        ];

        return {
            subjectId: subject.id,
            subjectName: subject.name,
            scores,
            average: calculateSubjectAverage(scores)
        };
    });

    const average = subjectResults.length
        ? subjectResults.reduce((sum, item) => sum + item.average, 0) /
          subjectResults.length
        : 0;

    const failedSubjects = subjectResults.filter(item => item.average < 5);
    const hasFailedSubject = failedSubjects.length > 0;
    const classification = classifyAverage(average);

    return {
        subjectResults,
        average,
        classification,
        hasFailedSubject,
        failedSubjects,
        rank: null,
        scholarshipGroup: "Ngoài top 50%",
        scholarship: 0
    };
}

export function calculateScholarships(students) {
    if (!Array.isArray(students) || students.length === 0) {
        return [];
    }

    const sorted = [...students].sort((a, b) => {
        const diffAvg = b.average - a.average;
        if (Math.abs(diffAvg) > 1e-12) {
            return diffAvg;
        }
        return String(a.id).localeCompare(String(b.id), "en", { sensitivity: "base" });
    });

    const n = sorted.length;
    const top10End = Math.min(n, Math.ceil(n * 0.10));
    const top30End = Math.min(n, Math.ceil(n * 0.30));
    const top50End = Math.min(n, Math.ceil(n * 0.50));

    const tiers = [
        {
            name: "Top 10%",
            start: 0,
            end: top10End,
            fund: Math.round(TOTAL_SCHOLARSHIP_FUND * 0.40)
        },
        {
            name: "Top 11% – 30%",
            start: top10End,
            end: top30End,
            fund: Math.round(TOTAL_SCHOLARSHIP_FUND * 0.40)
        },
        {
            name: "Top 31% – 50%",
            start: top30End,
            end: top50End,
            fund: Math.round(TOTAL_SCHOLARSHIP_FUND * 0.20)
        }
    ];

    sorted.forEach((entry, idx) => {
        entry.rank = idx + 1;
        entry.scholarshipGroup = "Ngoài top 50%";
        entry.scholarship = 0;
    });

    for (const tier of tiers) {
        const count = tier.end - tier.start;
        if (count <= 0) continue;

        const unit = 1000;
        const totalUnits = Math.floor(tier.fund / unit);
        const baseUnitsPerStudent = Math.floor(totalUnits / count);
        const remainderUnits = totalUnits - baseUnitsPerStudent * count;

        for (let i = tier.start; i < tier.end; i++) {
            const indexInTier = i - tier.start;
            const unitsForStudent =
                baseUnitsPerStudent + (indexInTier < remainderUnits ? 1 : 0);

            sorted[i].scholarshipGroup = tier.name;
            sorted[i].scholarship = unitsForStudent * unit;
        }
    }

    return sorted;
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(amount);
}
