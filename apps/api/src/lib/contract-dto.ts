export const CONTRACT_INCLUDE = {
  versions: {
    orderBy: { versionNo: "asc" as const },
    include: {
      comments: { orderBy: { createdAt: "asc" as const } },
    },
  },
};

export function mapContract(c: any) {
  return {
    id: c.id,
    contractType: c.contractType,
    state: c.state,
    currentVersionId: c.currentVersionId,
    versions: (c.versions ?? []).map((v: any) => ({
      id: v.id,
      versionNo: v.versionNo,
      kind: v.kind,
      uploadedBySide: v.uploadedBySide,
      fileBlobId: v.fileBlobId,
      fileName: v.fileName,
      createdAt: v.createdAt.toISOString(),
    })),
    comments: (c.versions ?? []).flatMap((v: any) =>
      (v.comments ?? []).map((cm: any) => ({
        id: cm.id,
        authorSide: cm.authorSide,
        body: cm.body,
        fileBlobId: cm.fileBlobId,
        fileName: cm.fileName,
        createdAt: cm.createdAt.toISOString(),
      }))
    ).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  };
}
