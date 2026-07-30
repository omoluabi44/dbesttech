# --- Security Group for ALB ---
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb-sg"
  description = "Allow HTTP inbound traffic to ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-alb-sg"
  }
}

# --- Application Load Balancer ---
resource "aws_alb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  tags = {
    Name = "${var.project_name}-alb"
  }
}

# --- Backend Target Group ---
resource "aws_alb_target_group" "backend" {
  name        = "${var.project_name}-be-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"

  health_check {
    path                = "/api/"
    healthy_threshold   = 2
    unhealthy_threshold = 10
    timeout             = 60
    interval            = 300
    matcher             = "200,301,302,404"
  }

  tags = {
    Name = "${var.project_name}-backend-tg"
  }
}

# --- Frontend Target Group ---
resource "aws_alb_target_group" "frontend" {
  name        = "${var.project_name}-fe-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 10
    timeout             = 60
    interval            = 300
    matcher             = "200,301,302"
  }

  tags = {
    Name = "${var.project_name}-frontend-tg"
  }
}

# --- Target Group Attachments ---
resource "aws_alb_target_group_attachment" "backend" {
  target_group_arn = aws_alb_target_group.backend.arn
  target_id        = aws_instance.backend.id
  port             = 80
}

resource "aws_alb_target_group_attachment" "frontend" {
  target_group_arn = aws_alb_target_group.frontend.arn
  target_id        = aws_instance.frontend.id
  port             = 80
}

# --- ALB Listener (HTTP only — no domain/SSL yet) ---
resource "aws_alb_listener" "http" {
  load_balancer_arn = aws_alb.main.arn
  port              = "80"
  protocol          = "HTTP"

  # Default action: forward to frontend
  default_action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.frontend.arn
  }
}

# --- Listener Rules for Backend Path-Based Routing ---
resource "aws_alb_listener_rule" "api" {
  listener_arn = aws_alb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.backend.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

resource "aws_alb_listener_rule" "admin" {
  listener_arn = aws_alb_listener.http.arn
  priority     = 101

  action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.backend.arn
  }

  condition {
    path_pattern {
      values = ["/admin/*"]
    }
  }
}

resource "aws_alb_listener_rule" "static" {
  listener_arn = aws_alb_listener.http.arn
  priority     = 102

  action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.backend.arn
  }

  condition {
    path_pattern {
      values = ["/static/*"]
    }
  }
}
