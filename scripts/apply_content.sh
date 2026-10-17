#!/usr/bin/env bash
# Gộp file JSON nội dung vào landing page production theo slug (content = {...cũ, ...mới}).
#   apply_content.sh <slug> <file.json>            # sao lưu DB rồi ghi
#   apply_content.sh <slug> --show                  # chỉ đọc: in theme/tiêu đề/giá khóa hiện tại
# Biến môi trường BẮT BUỘC: HOST (vd root@<vps>), APP_DIR (thư mục cài ERP trên server)
# GHI DỮ LIỆU PRODUCTION — chỉ chạy cho trang chủ dự án yêu cầu.
set -euo pipefail
slug=$1; H=${HOST:?Đặt HOST=root@<vps>}; D=${APP_DIR:?Đặt APP_DIR=/đường/dẫn/ask-erp}
JS='const{PrismaClient}=require("@prisma/client");const p=new PrismaClient();let s="";process.stdin.on("data",d=>s+=d).on("end",async()=>{try{
const[slug,mode]=process.argv.slice(1);const pg=await p.mktLandingPage.findFirst({where:{slug}});if(!pg){console.log("KHÔNG CÓ TRANG "+slug);process.exit(2)}
if(mode!=="show"){const patch=JSON.parse(s);await p.mktLandingPage.update({where:{id:pg.id},data:{content:{...pg.content,...patch}}});console.log("updated "+pg.id)}
const g=await p.mktLandingPage.findUnique({where:{id:pg.id}});const c=g.courseId?await p.course.findUnique({where:{id:g.courseId},select:{price:true,listPrice:true,durationDays:true,classes:{select:{id:true},where:{startDate:{gte:new Date()}}}}}):null;
console.log(g.content.theme+" | "+g.content.headline);if(c)console.log("price "+c.price+" list "+c.listPrice+" days "+c.durationDays+" upcoming classes "+c.classes.length)
}finally{await p.$disconnect()}})'
if [ "${2:-}" = "--show" ]; then
  echo '{}' | ssh "$H" "cd $D/deploy && docker compose exec -T api node -e '$JS' '$slug' show"
else
  [ -f "$2" ] || { echo "Thiếu file $2"; exit 1; }
  ssh "$H" "cd $D/deploy && ./backup.sh | grep ask_erp_ | tail -1"
  ssh "$H" "cd $D/deploy && docker compose exec -T api node -e '$JS' '$slug' write" < "$2"
fi
