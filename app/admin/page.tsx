"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { getAllApplications, updateApplicationStatus } from "@/lib/firebase/applications";
import { Application } from "@/lib/firebase/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    status: "all" as "all" | "pending" | "approved" | "rejected",
    gender: "all" as "all" | "M" | "F",
  });

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [applications, filters]);

  const loadApplications = async () => {
    try {
      const data = await getAllApplications();
      setApplications(data);
    } catch (error) {
      console.error("지원서 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...applications];

    if (filters.status !== "all") {
      filtered = filtered.filter((app) => app.status === filters.status);
    }

    if (filters.gender !== "all") {
      // gender는 user 데이터에서 가져와야 함
    }

    if (filters.search) {
      filtered = filtered.filter(
        (app) =>
          app.job.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredApplications(filtered);
  };

  const handleApprove = async (uid: string) => {
    try {
      await updateApplicationStatus(uid, "approved");
      await loadApplications();
    } catch (error) {
      console.error("승인 실패:", error);
      alert("승인에 실패했습니다.");
    }
  };

  const handleReject = async (uid: string) => {
    try {
      await updateApplicationStatus(uid, "rejected");
      await loadApplications();
    } catch (error) {
      console.error("거절 실패:", error);
      alert("거절에 실패했습니다.");
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-white text-foreground flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-foreground py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">운영자 대시보드</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/admin/applications"
            className="bg-gray-100 border-2 border-primary rounded-lg p-6 hover:bg-primary group transition"
          >
            <h2 className="text-xl font-semibold mb-2 text-primary group-hover:text-white transition">지원자 관리</h2>
            <p className="text-gray-700 group-hover:text-white transition">지원서 검토 및 승인</p>
          </Link>
          <Link
            href="/admin/event"
            className="bg-gray-100 border-2 border-primary rounded-lg p-6 hover:bg-primary group transition"
          >
            <h2 className="text-xl font-semibold mb-2 text-primary group-hover:text-white transition">행사 설정</h2>
            <p className="text-gray-700 group-hover:text-white transition">행사 일정 및 설정</p>
          </Link>
          <Link
            href="/admin/matching"
            className="bg-gray-100 border-2 border-primary rounded-lg p-6 hover:bg-primary group transition"
          >
            <h2 className="text-xl font-semibold mb-2 text-primary group-hover:text-white transition">매칭 결과</h2>
            <p className="text-gray-700 group-hover:text-white transition">매칭 결과 확인</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

